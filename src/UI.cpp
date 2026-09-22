#include "Runtime.h"
#include "PrismaUI_API.h"

namespace GA {
namespace {
PRISMA_UI_API::IVPrismaUI1* prisma{};
PrismaView view{};
bool domReady{};
bool sinkRegistered{};
std::string session;
std::string token;
std::uint64_t revision{};
std::optional<Recipe> prepared;
RE::ObjectRefHandle activeBench;

std::string RandomToken()
{
    std::array<std::uint32_t, 4> words{};
    std::random_device source;
    for (auto& word : words) word = source();
    std::ostringstream text;
    text << std::hex << std::setfill('0');
    for (auto word : words) text << std::setw(8) << word;
    return text.str();
}

Json State(std::string_view kind, std::int64_t id, std::string_view message)
{
    auto* player = RE::PlayerCharacter::GetSingleton();
    Json result = {
        {"protocol", 1}, {"kind", kind}, {"id", id}, {"session", session},
        {"revision", revision}, {"rank", Rank()},
        {"alchemy", CurrentActorValue(player, RE::ActorValue::kAlchemy)},
        {"ingredients", InventoryJSON()}, {"message", message}
    };
    if (config.debug) {
        result["debug"] = {{"bench", activeBench.native_handle()}, {"prepared", prepared.has_value()}, {"revision", revision}};
    }
    return result;
}

void Send(const Json& data)
{
    if (!prisma || !view || !domReady || !prisma->IsValid(view)) return;
    const auto encoded = data.dump();
    prisma->InteropCall(view, "GuildAlchemyReceive", encoded.c_str());
}

void VerifyEnvelope(const Json& request)
{
    if (!request.is_object() || request.value("protocol", 0) != 1)
        throw std::runtime_error("Protocolo de interface inválido.");
    if (request.value("session", std::string{}) != session || !activeBench)
        throw std::runtime_error("A sessão da bancada expirou.");
    if (request.at("revision").get<std::uint64_t>() != revision)
        throw std::runtime_error("A interface está desatualizada; reabra a bancada.");
    auto bench = activeBench.get();
    auto* player = RE::PlayerCharacter::GetSingleton();
    if (!bench || !player || bench->GetBaseObject() != workbench || player->GetDistance(bench.get()) > 256.0f)
        throw std::runtime_error("Afastei-me da bancada; a sessão foi encerrada.");
}

void HandleRequest(Json request)
{
    const auto id = request.value("id", std::int64_t{0});
    try {
        VerifyEnvelope(request);
        const auto action = request.at("action").get<std::string>();
        if (action == "close") {
            CloseWorkbench();
            return;
        }
        if (action == "prepare") {
            auto recipe = Calculate(ParseRequest(request.at("payload")));
            token = RandomToken();
            prepared = std::move(recipe);
            ++revision;
            auto response = State("preview", id, "Preparação examinada. Nenhum ingrediente foi consumido.");
            response["preview"] = PreviewJSON(*prepared, token);
            if (config.debug) response["debug"]["fingerprint"] = prepared->fingerprint;
            Send(response);
            return;
        }
        if (action == "finalize") {
            const auto supplied = request.at("payload").at("token").get<std::string>();
            if (!prepared || token.empty() || supplied != token)
                throw std::runtime_error("Token de produção inválido ou já utilizado.");
            auto recipe = std::move(*prepared);
            prepared.reset();
            token.clear();
            Craft(recipe);
            ++revision;
            Send(State("crafted", id, "Produção concluída; ingredientes consumidos e produto adicionado ao inventário."));
            return;
        }
        throw std::runtime_error("Ação de interface desconhecida.");
    } catch (const std::exception& error) {
        prepared.reset();
        token.clear();
        ++revision;
        logga::warn("Pedido da bancada recusado: {}", error.what());
        Send(State("error", id, error.what()));
    }
}

void OnJSRequest(const char* raw)
{
    if (!raw) return;
    try {
        Json request = Json::parse(raw);
        SKSE::GetTaskInterface()->AddTask([request = std::move(request)]() mutable { HandleRequest(std::move(request)); });
    } catch (const std::exception& error) {
        logga::warn("JSON rejeitado pela interface: {}", error.what());
    }
}

class ActivationSink final : public RE::BSTEventSink<RE::TESActivateEvent> {
public:
    RE::BSEventNotifyControl ProcessEvent(const RE::TESActivateEvent* event,
        RE::BSTEventSource<RE::TESActivateEvent>*) override
    {
        auto* player = RE::PlayerCharacter::GetSingleton();
        if (event && event->objectActivated && event->actionRef.get() == player &&
            event->objectActivated->GetBaseObject() == workbench) {
            SyncGuildAlchemyRank();
            OpenWorkbench(event->objectActivated->GetHandle());
        }
        return RE::BSEventNotifyControl::kContinue;
    }
};
ActivationSink activationSink;
}

void AcquirePrisma()
{
    if (!prisma) prisma = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI1>();
    if (!prisma) logga::warn("PrismaUI V1 ainda não está disponível.");
}

void InitializeUI()
{
    if (!prisma || view) {
        if (!prisma) logga::critical("PrismaUI é obrigatório e não foi carregado.");
        return;
    }
    view = prisma->CreateView("GuildAlchemy/index.html", [](PrismaView readyView) {
        if (readyView != view || !prisma) return;
        domReady = true;
        prisma->Hide(view);
        logga::info("Prisma UI pronta: {}", view);
    });
    if (!view) {
        logga::critical("PrismaUI não conseguiu criar GuildAlchemy/index.html.");
        return;
    }
    prisma->RegisterJSListener(view, "GuildAlchemyRequest", OnJSRequest);
    prisma->SetOrder(view, 100);
}

void RegisterActivationSink()
{
    if (sinkRegistered) return;
    if (auto* source = RE::ScriptEventSourceHolder::GetSingleton()) {
        source->AddEventSink<RE::TESActivateEvent>(std::addressof(activationSink));
        sinkRegistered = true;
        logga::info("Listener de ativação da bancada registrado.");
    }
}

void OpenWorkbench(RE::ObjectRefHandle handle)
{
    if (!prisma || !view || !domReady || !prisma->IsValid(view)) {
        logga::error("Ativação recusada: Prisma UI indisponível.");
        return;
    }
    activeBench = handle;
    logga::info("Bancada ativada; referência {:08X}", handle.native_handle());
    session = RandomToken();
    token.clear();
    prepared.reset();
    revision = 0;
    prisma->Show(view);
    if (!prisma->Focus(view, true)) {
        activeBench.reset();
        prisma->Hide(view);
        logga::error("PrismaUI não conseguiu obter foco.");
        return;
    }
    Send(State("open", 0, Rank() ? "Bancada pronta." : "Requer Alquimia 20 para obter a patente Novato."));
}

void CloseWorkbench()
{
    if (prisma && view && prisma->IsValid(view)) {
        if (prisma->HasFocus(view)) prisma->Unfocus(view);
        prisma->Hide(view);
    }
    activeBench.reset();
    session.clear();
    token.clear();
    prepared.reset();
    ++revision;
}

void ResetSession()
{
    CloseWorkbench();
}
}
