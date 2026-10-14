#include "night/bridge.h"
#include "night/world.hpp"
#include <string>
namespace { std::string result_json, error_text; }
extern "C" {
uint32_t nr_api_version() { return 1; }
uint32_t nr_generate(const char* seed, uint32_t length) {
  result_json.clear(); error_text.clear();
  if (!seed || length > 256) { error_text = "Invalid seed buffer or length."; return 1; }
  std::string normalized;
  if (!night::normalize_seed(std::string_view(seed, length), normalized, error_text)) return 1;
  const auto result = night::generate(normalized);
  if (!result.ok()) { error_text = result.errors.front(); return 2; }
  result_json = night::envelope_json(result.world);
  return 0;
}
const char* nr_result_ptr() { return result_json.c_str(); }
uint32_t nr_result_size() { return static_cast<uint32_t>(result_json.size()); }
const char* nr_error_ptr() { return error_text.c_str(); }
uint32_t nr_error_size() { return static_cast<uint32_t>(error_text.size()); }
}

