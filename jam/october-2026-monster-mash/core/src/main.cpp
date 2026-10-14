#include "night/world.hpp"
#include <iostream>
int main(int argc, char** argv) {
  if (argc != 2) { std::cerr << "Usage: night_manifest <seed>\n"; return 2; }
  const auto result = night::generate(argv[1]);
  if (!result.ok()) { for (const auto& error : result.errors) std::cerr << error << '\n'; return 1; }
  std::cout << night::envelope_json(result.world) << '\n';
}

