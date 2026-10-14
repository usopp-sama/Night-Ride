#include "night/world.hpp"
#include "night/bridge.h"
#include <cstdlib>
#include <iostream>
#include <set>
#include <string>
#include <algorithm>

namespace {
int checks = 0;
void require(bool condition, const std::string& message) {
  ++checks;
  if (!condition) { std::cerr << "FAIL: " << message << '\n'; std::exit(1); }
}
}
int main() {
  using namespace night;
  require(hash32("") == 2166136261u && hash32("hello") == 0x4f9f2cabu, "FNV32 reference vectors");
  require(hash64("hello") == "a430d84680aabd0b", "FNV64 reference vector");
  const auto base = generate("moonlit-run");
  require(base.ok(), "benchmark seed validates");
  require(generate(" \tmoonlit-run\r\n").world == base.world, "ASCII edge whitespace normalization");
  require(!generate("").ok() && !generate("   ").ok(), "blank seed rejected");
  require(!generate(std::string(129, 'x')).ok(), "oversized seed rejected");
  require(generate(std::string(128, 'x')).ok(), "max length accepted");
  require(generate("रात 🌙").ok(), "UTF-8 seed accepted");
  require(!generate(std::string("a\0b",3)).ok(), "embedded NUL rejected");
  require(!generate(std::string("\xc0\xaf",2)).ok(), "overlong UTF-8 rejected");
  require(!generate(std::string("\xed\xa0\x80",3)).ok(), "UTF-8 surrogate rejected");
  require(!generate(std::string("\xf4\x90\x80\x80",4)).ok(), "out-of-range UTF-8 rejected");
  require(!generate(std::string("\xe2\x82",2)).ok(), "truncated UTF-8 rejected");
  require(generate("\"a\\b\"").ok(), "JSON punctuation accepted as data");
  require(escape_json("\"\\\n") == "\"\\\"\\\\\\u000a\"", "JSON escaping");
  RandomStream a("moonlit-run", "roads"), b("moonlit-run", "roads"), decoration("moonlit-run", "decoration/chunk-1");
  for (int i=0; i<1000; ++i) { for (int j=0; j<13; ++j) decoration.next(); require(a.next() == b.next(), "stream isolation"); }
  RandomStream attempt0("moonlit-run", "roads",0), attempt1("moonlit-run", "roads",1);
  require(attempt0.next() != attempt1.next(), "retry namespace changes stream");
  std::set<std::string> hashes, layouts, topologies;
  for (int i=0; i<1000; ++i) {
    const auto seed = "corpus-" + std::to_string(i);
    const auto one = generate(seed), two = generate(seed);
    require(one.ok(), "corpus validity: " + seed);
    require(one.world == two.world && envelope_json(one.world) == envelope_json(two.world), "repeat generation: " + seed);
    hashes.insert(hash64(canonical_json(one.world)));
    std::string layout, topology;
    for (const auto& n : one.world.nodes) layout += std::to_string(n.x_m) + "," + std::to_string(n.z_m) + ";";
    for (const auto& e : one.world.edges) topology += e.from + ">" + e.to + ";";
    layouts.insert(layout); topologies.insert(topology);
  }
  require(hashes.size() == 1000 && layouts.size() == 1000, "different seeds differ beyond seed metadata");
  require(topologies.size() >= 4, "variable reconnections and optional branch");
  auto bad = base.world; bad.edges.front().to = "missing";
  require(!validate(bad).empty(), "invalid edge rejected");
  bad = base.world; bad.nodes[1].id = bad.nodes[0].id;
  require(!validate(bad).empty(), "duplicate node rejected");
  bad = base.world; bad.nodes[1].x_m = 0; bad.nodes[1].z_m = 0;
  require(!validate(bad).empty(), "overlap rejected");
  bad = base.world; bad.main_route_length_m += 1;
  require(!validate(bad).empty(), "incorrect route total rejected");
  bad = base.world; bad.edges.erase(bad.edges.begin());
  require(!validate(bad).empty(), "broken main route rejected");
  bad = base.world; bad.nodes[2].role = "junction";
  require(!validate(bad).empty(), "missing service rejected");
  bad = base.world; bad.edges[0].main_route = false;
  require(!validate(bad).empty(), "main-spine corruption rejected");
  bad = base.world; bad.generator = "unknown";
  require(!validate(bad).empty(), "future generator rejected");
  bad = base.world; bad.nodes.back().x_m = 2147483647;
  require(!validate(bad).empty(), "extreme coordinate rejected safely");
  require(nr_api_version() == 1, "ABI version");
  require(nr_generate("moonlit-run",11) == 0, "C ABI generation");
  require(std::string(nr_result_ptr(),nr_result_size()) == envelope_json(base.world), "ABI native parity");
  require(nr_generate(nullptr, 5) == 1 && nr_result_size() == 0 && nr_error_size() > 0, "ABI error clears stale output");
  std::cout << checks << " checks passed; 1,000 seeds; " << topologies.size() << " graph topologies.\n";
}
