cmake_minimum_required(VERSION 3.20)
project(night_ride_core VERSION 0.1.0 LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(night_core STATIC core/src/world.cpp core/src/bridge.cpp core/src/vehicle.cpp core/src/drive_bridge.cpp core/src/scene.cpp)
target_include_directories(night_core PUBLIC core/include)

# engine-sim (MIT) core simulation + its constraint solver, without the UI/app layer.
file(GLOB ENGINE_SIM_SOURCES vendor/engine-sim/src/*.cpp vendor/simple-2d-constraint-solver/src/*.cpp)
add_library(engine_sim STATIC ${ENGINE_SIM_SOURCES} core/src/engine_sim_audio.cpp)
target_include_directories(engine_sim PUBLIC vendor/engine-sim/include vendor/simple-2d-constraint-solver/include)
# NDEBUG: upstream asserts reference a member that no longer exists (piston_engine_simulator.cpp).
target_compile_definitions(engine_sim PRIVATE NDEBUG "__forceinline=inline __attribute__((always_inline))")
if(NOT MSVC)
  target_compile_options(engine_sim PRIVATE -O3 -w)
endif()
if(MSVC)
  target_compile_options(night_core PRIVATE /W4 /permissive-)
else()
  target_compile_options(night_core PRIVATE -Wall -Wextra -Wpedantic -Wconversion -Wshadow)
endif()

if(EMSCRIPTEN)
  # Standalone WASM instantiated inside the AudioWorklet (no JS glue there).
  add_executable(engine_audio core/src/audio_entry.cpp)
  target_link_libraries(engine_audio PRIVATE engine_sim)
  set_target_properties(engine_audio PROPERTIES SUFFIX .wasm RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/public/wasm")
  target_link_options(engine_audio PRIVATE --no-entry -sSTANDALONE_WASM=1 -sFILESYSTEM=0
    -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=33554432 -sSTACK_SIZE=1048576 -sERROR_ON_UNDEFINED_SYMBOLS=1
    "-sEXPORTED_FUNCTIONS=['_nr_es_init','_nr_es_control','_nr_es_render','_nr_es_rpm','_nr_es_quality']")
  add_executable(night_core_web core/src/web_entry.cpp)
  target_link_libraries(night_core_web PRIVATE night_core)
  set_target_properties(night_core_web PROPERTIES OUTPUT_NAME night_core SUFFIX .js
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/public/wasm")
  target_link_options(night_core_web PRIVATE
    --no-entry -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,node
    -sFILESYSTEM=0 -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=16777216 -sMAXIMUM_MEMORY=67108864
    "-sEXPORTED_FUNCTIONS=['_nr_api_version','_nr_generate','_nr_result_ptr','_nr_result_size','_nr_error_ptr','_nr_error_size','_nr_drive_version','_nr_drive_input','_nr_drive_snapshot','_nr_drive_step','_nr_drive_reset','_nr_drive_recover','_nr_track_count','_nr_track_data','_nr_scene_generate','_nr_scene_ptr','_nr_scene_size','_malloc','_free']"
    "-sEXPORTED_RUNTIME_METHODS=['HEAPU8']")
else()
  add_executable(night_manifest core/src/main.cpp)
  target_link_libraries(night_manifest PRIVATE night_core)
  include(CTest)
  if(BUILD_TESTING)
    add_executable(night_core_tests tests/core_tests.cpp)
    target_link_libraries(night_core_tests PRIVATE night_core)
    add_test(NAME world_contract COMMAND night_core_tests)
    add_executable(night_vehicle_tests tests/vehicle_tests.cpp)
    target_link_libraries(night_vehicle_tests PRIVATE night_core)
    add_test(NAME vehicle_contract COMMAND night_vehicle_tests)
    add_executable(night_engine_render tests/engine_sim_render.cpp)
    target_link_libraries(night_engine_render PRIVATE engine_sim)
    # Both engine definitions must build, track the requested RPM and produce sound.
    add_test(NAME engine_sim_gm_ls COMMAND night_engine_render 0 ${CMAKE_BINARY_DIR}/engine-gm-ls.wav)
    add_test(NAME engine_sim_ferrari_f136 COMMAND night_engine_render 1 ${CMAKE_BINARY_DIR}/engine-f136.wav)
    add_executable(night_replay tests/drive_replay.cpp)
    target_link_libraries(night_replay PRIVATE night_core)
  endif()
endif()

