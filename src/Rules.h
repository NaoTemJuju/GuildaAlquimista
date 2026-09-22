#pragma once
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <limits>
#include <map>
#include <stdexcept>
#include <vector>

namespace GA::Rules {
using ID = std::uint32_t;
inline std::map<ID, int> Costs(const std::vector<ID>& ids, int operations, ID reagent, int maximum)
{
    if (ids.size() < 2 || ids.size() > 3 || operations < 1 || operations > maximum)
        throw std::runtime_error("Selecione 2 ou 3 ingredientes e uma quantidade válida.");
    std::map<ID, int> result;
    for (auto id : ids) {
        if (!id || result.contains(id)) throw std::runtime_error("Ingredientes repetidos ou inválidos.");
        result[id] = operations;
    }
    if (reagent) {
        if (!result.contains(reagent) || operations > (std::numeric_limits<int>::max)() / 2)
            throw std::runtime_error("Reagente de concentração inválido.");
        result[reagent] += operations;
    }
    return result;
}
inline int Maximum(const std::map<ID, int>& inventory, const std::map<ID, int>& unitCosts, int cap)
{
    for (auto [id, count] : unitCosts) {
        if (count <= 0) throw std::runtime_error("Custo inválido.");
        auto it = inventory.find(id);
        if (it == inventory.end()) return 0;
        cap = (std::min)(cap, (std::max)(0, it->second) / count);
    }
    return cap;
}
enum class Axis { None, Magnitude, Duration };
inline Axis ScalingAxis(bool powerMagnitude, bool powerDuration, bool noMagnitude, bool noDuration)
{
    bool m = powerMagnitude && !noMagnitude, d = powerDuration && !noDuration;
    if (m == d) return Axis::None; // Neither or ambiguous: fail closed for refinement.
    return m ? Axis::Magnitude : Axis::Duration;
}
inline double Scale(double value, double factor, bool duration)
{
    if (!std::isfinite(value) || value < 0 || !std::isfinite(factor) || factor <= 0 || factor > 1.15)
        throw std::runtime_error("Potência fora dos limites permitidos.");
    double result = value * factor;
    if (result > 1000000) throw std::runtime_error("Potência excede o limite de segurança.");
    // A duration decrease never rounds upward into a bonus. Short effects may become zero:
    // reject that refinement instead of silently removing their behavior.
    if (duration) {
        result = std::floor(result);
        if (value > 0 && result < 1) throw std::runtime_error("Duração curta demais para refinar com segurança.");
    }
    return result;
}
}
