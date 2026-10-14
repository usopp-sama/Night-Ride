# Toolchain snapshot — October 14, 2026

- Host: macOS 27.0.1, Apple M4 Pro, arm64, 24 GiB RAM.
- Native compiler: Apple Clang 21.0.0 (Xcode command-line tools).
- CMake: 4.4.4.
- Emscripten: 6.0.12 (Homebrew).
- Node: 26.11.1; npm: 11.20.0.
- Python used by Emscripten: Homebrew Python 3.14.8.
- Vite: 8.3.4; TypeScript: 7.0.2; Playwright: 1.64.1.
- Three.js: 0.180.0; @types/three: 0.180.0 (exact npm pins).
- Test Chromium: 156.0.8078.4 (Playwright build 1248).
- Test WebKit: 27.2 (Playwright build 2370).
- RUN CLI: not installed; authenticated hosted probe pending.
- RUN SDK: not installed; 5.29.1 observed in registry, integration pending.
- Template: original minimal Vite shell; no external template copied.

Native tests build in Debug to retain diagnostic information. Browser core builds in Release. `EM_CACHE` is set to `build/emcache`, within the checkout. `EMSDK_PYTHON` is honored when supplied; otherwise task scripts discover Python >=3.10. CMake uses the Emscripten toolchain via `emcmake`.

Single-threaded WASM starts with 16 MiB memory, grows as required up to 64 MiB. This bound applies to the first generator; it is not a future full-game memory guarantee. The parity suite deliberately forces a growth event to test heap-view handling.

The npm package versions are exact and locked. Toolchain upgrades must pass golden manifest fixtures, native tests, native/WASM parity, and browser tests before replacing these versions.
