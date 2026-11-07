#include "Runtime.h"
#include "MeridianUIAPI/API.h"
#include "MeridianUIAPI/SKSELoader.h"

namespace GA {
namespace {
Meridian::UI::IUIPlatformAPI* meridian{};
Meridian::CEF::IBrowser* browser{};
Meridian::UI::IUIPlatformAPI::BrowserRefHandle browserHandle{};
std::atomic_bool platformStopped{};
bool domReady{};
bool sinkRegistered{};
bool inputSinkRegistered{};
std::string session;
std::string token;
std::uint64_t revision{};
std::optional<Recipe> prepared;
RE::ObjectRefHandle activeBench;
RE::GPtr<RE::GFxMovieView> hiddenHudMovie;
enum class HiddenHudPart { none, rollover, wholeMovie };
HiddenHudPart hiddenHudPart{HiddenHudPart::none};
constexpr auto rolloverVisibility = "_root.HUDMovieBaseInstance.RolloverNameInstance._visible";
constexpr auto movieVisibility = "_root._visible";

void HideSkyrimHUD()
{
    if (hiddenHudMovie) return;
    auto* ui = RE::UI::GetSingleton();
    auto movie = ui ? ui->GetMovieView(RE::HUDMenu::MENU_NAME) : nullptr;
    if (!movie) {
        logga::warn("HUD Menu indisponível ao abrir a bancada; aviso de ativação pode continuar visível.");
        return;
    }

    RE::GFxValue visible;
    if (movie->GetVariable(&visible, rolloverVisibility) && visible.IsBool()) {
        if (!visible.GetBool()) return;  // Outro sistema já ocultou o aviso.
        if (movie->SetVariable(rolloverVisibility, RE::GFxValue(false), RE::GFxMovie::SetVarType::kNormal)) {
            hiddenHudPart = HiddenHudPart::rollover;
            hiddenHudMovie = std::move(movie);
            logga::info("Nome de ativação ocultado durante a sessão da bancada.");
            return;
        }
    }

    // HUDs personalizados podem mover o campo de texto. A raiz do HUD é o fallback.
    if (!movie->GetVariable(&visible, movieVisibility) || !visible.IsBool()) {
        logga::warn("Não foi possível ler a visibilidade do HUD Menu.");
        return;
    }
    if (!visible.GetBool()) return;
    if (movie->SetVariable(movieVisibility, RE::GFxValue(false), RE::GFxMovie::SetVarType::kNormal)) {
        hiddenHudPart = HiddenHudPart::wholeMovie;
        hiddenHudMovie = std::move(movie);
        logga::info("HUD Menu ocultado durante a sessão da bancada (fallback).");
    } else {
        logga::warn("Não foi possível ocultar o HUD Menu.");
    }
}

void RestoreSkyrimHUD()
{
    if (!hiddenHudMovie) return;
    const auto path = hiddenHudPart == HiddenHudPart::rollover ? rolloverVisibility : movieVisibility;
    if (!hiddenHudMovie->SetVariable(path, RE::GFxValue(true), RE::GFxMovie::SetVarType::kNormal)) {
        logga::warn("Não foi possível restaurar a visibilidade do HUD Menu.");
    }
    hiddenHudMovie = nullptr;
    hiddenHudPart = HiddenHudPart::none;
}

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
        {"ingredients", InventoryJSON()}, {"bottles", emptyBottle && player ? player->GetItemCount(emptyBottle) : 0}, {"message", message}
    };
    if (config.debug) {
        result["debug"] = {{"bench", activeBench.native_handle()}, {"prepared", prepared.has_value()}, {"revision", revision}};
    }
    return result;
}

void Send(const Json& data)
{
    if (platformStopped.load() || !browser || !domReady) return;
    const auto encoded = data.dump();
    browser->ExecEventFunction("guildalchemy:state", encoded.c_str());
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

void OnJSRequest(const char** args, int count)
{
    if (platformStopped.load() || !domReady || count != 1 || !args || !args[0]) return;
    try {
        // Meridian marshals each JS argument as JSON. The page sends an object.
        auto request = Json::parse(args[0]);
        if (!request.is_object()) throw std::runtime_error("Pedido deve ser um objeto JSON.");
        HandleRequest(std::move(request)); // executeInGameThread is set on the binding.
    } catch (const std::exception& error) {
        logga::warn("JSON rejeitado pela interface Meridian: {}", error.what());
    }
}

void OnPageReady(const char**, int count)
{
    if (platformStopped.load() || !browser || count != 0) return;
    // The page has registered its event listener before announcing readiness.
    // A reload invalidates any earlier transaction and leaves the view closed.
    CloseWorkbench();
    domReady = true;
    logga::info("Meridian UI pronta: GuildAlchemy.Main");
}

void OnPlatformShutdown()
{
    // Meridian owns the browser lifetime; never dereference it after shutdown.
    platformStopped.store(true);
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

class InputSink final : public RE::BSTEventSink<RE::InputEvent*> {
public:
    RE::BSEventNotifyControl ProcessEvent(RE::InputEvent* const* events,
        RE::BSTEventSource<RE::InputEvent*>*) override
    {
        if (!activeBench || !events) return RE::BSEventNotifyControl::kContinue;
        for (auto* event=*events; event; event=event->next) {
            auto* button=event->AsButtonEvent();
            if (button && button->IsDown() && button->GetDevice() == RE::INPUT_DEVICE::kKeyboard &&
                button->GetIDCode() == 0x01) {
                CloseWorkbench();
                break;
            }
        }
        return RE::BSEventNotifyControl::kContinue;
    }
};
InputSink inputSink;
}

void InitializeMeridian()
{
    Meridian::UI::SKSELoader::GetUIPlatformAPIWithVersionCheck([](Meridian::UI::IUIPlatformAPI* api) {
        if (!api || platformStopped.load()) return;
        meridian = api;
        meridian->RegisterOnShutdown(OnPlatformShutdown);
        InitializeUI();
    });
}

void ProcessMeridianMessage(SKSE::MessagingInterface::Message* message)
{
    static Meridian::UI::Settings settings{};
    if (message && !platformStopped.load())
        Meridian::UI::SKSELoader::ProcessSKSEMessage(message, &settings);
}

void InitializeUI()
{
    if (platformStopped.load() || !meridian || browserHandle) return;
    static Meridian::JS::JSFuncInfo request{"GuildAlchemyUI", "request", {OnJSRequest, true, false}};
    static Meridian::JS::JSFuncInfo ready{"GuildAlchemyUI", "ready", {OnPageReady, true, false}};
    static Meridian::JS::JSFuncInfo events{"GuildAlchemyUI", "addEventListener", {nullptr, true, true}};
    Meridian::JS::JSFuncInfo* bindings[] = {&request, &ready, &events};
    Meridian::UI::BrowserSettings settings{};
    settings.frameRate = 60;
    browserHandle = meridian->AddOrGetBrowser("GuildAlchemy.Main", bindings, 3,
        "mod://GuildAlchemy/index.html", &settings, browser);
    if (!browserHandle || !browser) {
        browser = nullptr;
        logga::critical("MeridianUI não conseguiu criar mod://GuildAlchemy/index.html.");
        return;
    }
    browser->SetBrowserVisible(false);
    browser->SetBrowserFocused(false);
    browser->SetBrowserZOrder(100);
    logga::info("Interface GuildAlchemy criada no MeridianUI; aguardando a página.");
}

void RegisterActivationSink()
{
    if (!sinkRegistered) if (auto* source = RE::ScriptEventSourceHolder::GetSingleton()) {
        source->AddEventSink<RE::TESActivateEvent>(std::addressof(activationSink));
        sinkRegistered = true;
        logga::info("Listener de ativação da bancada registrado.");
    }
    if (!inputSinkRegistered) if (auto* input=RE::BSInputDeviceManager::GetSingleton()) {
        input->AddEventSink(std::addressof(inputSink));
        inputSinkRegistered=true;
        logga::info("Listener nativo de Escape registrado.");
    }
}

void OpenWorkbench(RE::ObjectRefHandle handle)
{
    if (platformStopped.load() || !browser || !domReady || !browser->IsPageLoaded()) {
        logga::error("Ativação recusada: Meridian UI indisponível ou carregando.");
        return;
    }
    activeBench = handle;
    logga::info("Bancada ativada; referência {:08X}", handle.native_handle());
    session = RandomToken();
    token.clear();
    prepared.reset();
    revision = 0;
    browser->SetBrowserVisible(true);
    browser->SetBrowserFocused(true);
    HideSkyrimHUD();
    // Meridian queues focus on the UI task interface. IsBrowserFocused() would
    // still describe the previous owner here; hiding now cancels the request.
    Send(State("open", 0, Rank() ? "Bancada pronta." : "Requer Alquimia 20 para obter a patente Novato."));
    logga::info("Bancada aberta no MeridianUI; foco solicitado à fila de UI.");
}

void CloseWorkbench()
{
    if (!platformStopped.load() && browser) {
        if (domReady && activeBench) {
            Send(Json{{"protocol", 1}, {"kind", "closed"}, {"session", session},
                {"revision", revision}, {"id", 0}});
        }
        browser->SetBrowserFocused(false);
        browser->SetBrowserVisible(false);
    }
    RestoreSkyrimHUD();
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
