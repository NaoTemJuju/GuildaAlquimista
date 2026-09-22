# Compilando Guild Alchemy

Requisitos: Visual Studio 2022 Build Tools com MSVC x64 e Windows SDK, CMake 3.25+, Ninja, Git e vcpkg.

Clone CommonLibSSE-NG, mantenha o branch `ng` e instale no triplet `x64-windows-static-md`:

```powershell
vcpkg install spdlog directxtk directxmath rapidcsv nlohmann-json --triplet x64-windows-static-md
```

Configure e compile:

```powershell
cmake -S . -B build -G Ninja `
  -DCMAKE_BUILD_TYPE=Release `
  -DCOMMONLIB_PATH=C:/deps/CommonLibSSE-NG `
  -DCMAKE_TOOLCHAIN_FILE=C:/deps/vcpkg/scripts/buildsystems/vcpkg.cmake `
  -DVCPKG_TARGET_TRIPLET=x64-windows-static-md
cmake --build build --parallel
ctest --test-dir build --output-on-failure
```

O alvo gera `GuildAlchemy.dll`. Copie-o para `Data/SKSE/Plugins/`. O projeto compila SE+AE com CommonLibSSE-NG, sem hooks/trampolines e com Address Library.

Build validado nesta entrega: MSVC `14.44.35207`, VS Build Tools `17.14.41`, Windows SDK `10.0.26100`, runtime alvo `1.6.1170`.

