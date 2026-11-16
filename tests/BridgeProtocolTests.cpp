#include "BridgeProtocol.h"
#include <cassert>
#include <iostream>

int main()
{
    using namespace GA::Bridge;
    const auto legacy = ParseFormKey("000800:GuildAlchemy.esp");
    assert(legacy.has_value());
    assert(legacy->pluginName == "GuildAlchemy.esp");
    assert(legacy->localFormId == 0x800u);
    assert(legacy->ToStableString() == "GuildAlchemy.esp|000800");

    const auto stable = ParseFormKey("Apothecary.esp|246C21");
    assert(stable.has_value());
    assert(stable->pluginName == "Apothecary.esp");
    assert(stable->localFormId == 0x246C21u);

    assert(!ParseFormKey("bad").has_value());
    assert(!ParseFormKey("123:Skyrim.esm").has_value());

    const auto payload = BuildActivationPayload("GuildAlchemy.esp|000800", 0x14000801u);
    assert(payload == "{\"workbenchKey\":\"GuildAlchemy.esp|000800\",\"refFormId\":\"0x14000801\"}");

    std::cout << "GuildAlchemy bridge protocol tests: OK\n";
    return 0;
}
