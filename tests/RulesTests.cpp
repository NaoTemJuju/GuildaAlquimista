#include "Rules.h"
#include <cassert>
#include <iostream>

int main()
{
    using namespace GA::Rules;
    const auto plain = Costs({10, 20}, 3, 0, 10);
    assert(plain.at(10) == 3 && plain.at(20) == 3);
    const auto concentrated = Costs({10, 20}, 3, 20, 10);
    assert(concentrated.at(10) == 3 && concentrated.at(20) == 6);
    assert(Maximum({{10, 9}, {20, 7}}, Costs({10, 20}, 1, 20, 1), 100) == 3);
    assert(ScalingAxis(true, false, false, false) == Axis::Magnitude);
    assert(ScalingAxis(false, true, false, false) == Axis::Duration);
    assert(ScalingAxis(true, true, false, false) == Axis::None);
    assert(Scale(100.0, 1.15, false) == 115.0);
    assert(Scale(11.0, 0.9, true) == 9.0);

    bool rejected = false;
    try { (void)Costs({10, 10}, 1, 0, 10); } catch (const std::runtime_error&) { rejected = true; }
    assert(rejected);
    rejected = false;
    try { (void)Scale(1.0, 1.16, false); } catch (const std::runtime_error&) { rejected = true; }
    assert(rejected);

    std::cout << "GuildAlchemy deterministic rules: OK\n";
    return 0;
}
