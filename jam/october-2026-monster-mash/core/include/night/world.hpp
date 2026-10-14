#pragma once
#include <cstdint>
#include <string>
#include <string_view>
#include <vector>

namespace night {
inline constexpr std::uint32_t schema_version = 1;
inline constexpr std::string_view generator_version = "0.1.0-graph";
inline constexpr std::size_t max_seed_bytes = 128;

// All overflow here is intentional unsigned modulo-2^32 arithmetic.
std::uint32_t hash32(std::string_view text);
std::string hash64(std::string_view text);
bool normalize_seed(std::string_view raw, std::string& normalized, std::string& error);
class RandomStream {
 public:
  RandomStream(std::string_view seed, std::string_view domain, std::uint32_t attempt = 0);
  std::uint32_t next();
  std::uint32_t bounded(std::uint32_t exclusive_max);
 private:
  std::uint32_t state_;
};

struct Node {
  std::string id;
  std::string role;
  std::string label;
  std::int32_t x_m = 0;
  std::int32_t z_m = 0;
  bool operator==(const Node&) const = default;
};
struct Edge {
  std::string id, from, to, surface;
  std::uint32_t length_m = 0;
  bool main_route = false;
  bool operator==(const Edge&) const = default;
};
struct WorldManifest {
  std::uint32_t schema = schema_version;
  std::string generator = std::string(generator_version);
  std::string seed;
  std::uint32_t seed_hash = 0, attempt = 0;
  std::string palette, weather;
  std::vector<Node> nodes;
  std::vector<Edge> edges;
  std::uint32_t main_route_length_m = 0;
  bool operator==(const WorldManifest&) const = default;
};
struct GenerationResult {
  WorldManifest world;
  std::vector<std::string> errors;
  bool ok() const { return errors.empty(); }
};
GenerationResult generate(std::string_view seed);
std::vector<std::string> validate(const WorldManifest& world);
std::string canonical_json(const WorldManifest& world);
std::string envelope_json(const WorldManifest& world);
std::string escape_json(std::string_view text);
} // namespace night

