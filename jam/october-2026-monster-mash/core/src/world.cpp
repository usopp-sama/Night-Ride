#include "night/world.hpp"
#include <algorithm>
#include <array>
#include <limits>
#include <map>
#include <set>

namespace night {
std::uint32_t hash32(std::string_view text) {
  std::uint32_t hash = 2166136261u;
  for (char byte : text) { hash ^= static_cast<unsigned char>(byte); hash *= 16777619u; }
  return hash;
}
std::string hash64(std::string_view text) {
  std::uint64_t hash = 14695981039346656037ull;
  for (char byte : text) { hash ^= static_cast<unsigned char>(byte); hash *= 1099511628211ull; }
  constexpr char hex[] = "0123456789abcdef";
  std::string result(16, '0');
  for (int i = 15; i >= 0; --i) { result[static_cast<std::size_t>(i)] = hex[hash & 15u]; hash >>= 4u; }
  return result;
}
namespace {
bool ascii_space(unsigned char c) { return c == ' ' || (c >= 9 && c <= 13); }
bool valid_utf8(std::string_view text) {
  for (std::size_t i = 0; i < text.size();) {
    const auto lead = static_cast<unsigned char>(text[i++]);
    if (lead < 0x80u) { if (lead < 0x20u || lead == 0x7fu) return false; continue; }
    unsigned count = 0;
    std::uint32_t value = 0, minimum = 0;
    if (lead >= 0xc2u && lead <= 0xdfu) { count = 1; value = lead & 0x1fu; minimum = 0x80u; }
    else if (lead >= 0xe0u && lead <= 0xefu) { count = 2; value = lead & 0x0fu; minimum = 0x800u; }
    else if (lead >= 0xf0u && lead <= 0xf4u) { count = 3; value = lead & 0x07u; minimum = 0x10000u; }
    else return false;
    if (i + count > text.size()) return false;
    for (unsigned j = 0; j < count; ++j) {
      const auto c = static_cast<unsigned char>(text[i++]);
      if ((c & 0xc0u) != 0x80u) return false;
      value = (value << 6u) | (c & 0x3fu);
    }
    if (value < minimum || value > 0x10ffffu || (value >= 0xd800u && value <= 0xdfffu)) return false;
  }
  return true;
}
// Integer square root avoids cross-target libm differences in manifest data.
std::uint32_t distance(const Node& a, const Node& b) {
  const auto dx = static_cast<std::int64_t>(a.x_m) - b.x_m;
  const auto dz = static_cast<std::int64_t>(a.z_m) - b.z_m;
  const auto square = static_cast<std::uint64_t>(dx * dx + dz * dz);
  std::uint64_t low = 0, high = 100000;
  while (low + 1 < high) {
    const auto mid = (low + high) / 2;
    if (mid * mid <= square) low = mid; else high = mid;
  }
  return static_cast<std::uint32_t>(low);
}
WorldManifest candidate(const std::string& seed, std::uint32_t attempt) {
  WorldManifest w;
  w.seed = seed; w.seed_hash = hash32(seed); w.attempt = attempt;
  RandomStream palette(seed, "palette", attempt), topology(seed, "topology", attempt);
  RandomStream roads(seed, "roads", attempt), landmarks(seed, "landmarks", attempt);
  constexpr std::array palettes{"coastal-indigo", "pine-emerald", "moor-amber"};
  constexpr std::array weather{"clear", "low-fog", "drizzle"};
  w.palette = palettes[palette.bounded(3)]; w.weather = weather[palette.bounded(3)];
  constexpr std::array ids{"start", "fork-west", "service", "fork-east", "ridge", "approach", "destination"};
  constexpr std::array roles{"start", "junction", "service", "junction", "junction", "approach", "destination"};
  constexpr std::array labels{"Departure", "West fork", "Last Light Garage", "East fork", "Ridge junction", "Final approach", "Moonrise Pier"};
  std::int32_t z = 0;
  const auto direction = topology.bounded(2) == 0 ? -1 : 1;
  for (std::size_t i = 0; i < ids.size(); ++i) {
    if (i > 0) z += static_cast<std::int32_t>(roads.bounded(301)) + 650;
    auto x = (static_cast<std::int32_t>(roads.bounded(601)) - 300) * direction;
    if (i == 0) x = 0;
    w.nodes.push_back({ids[i], roles[i], labels[i], x, z});
  }
  const auto add_edge = [&w](std::string id, std::size_t a, std::size_t b, bool main, std::string surface) {
    const auto length = distance(w.nodes[a], w.nodes[b]);
    w.edges.push_back({std::move(id), w.nodes[a].id, w.nodes[b].id, std::move(surface), length, main});
    if (main) w.main_route_length_m += length;
  };
  for (std::size_t i = 1; i < ids.size(); ++i) add_edge("main/" + std::string(ids[i-1]) + "/" + ids[i], i-1, i, true, "asphalt");
  const auto add_branch = [&](const char* id, const char* label, std::size_t from, std::size_t to, int side) {
    const auto index = w.nodes.size();
    const auto x = (static_cast<std::int32_t>(landmarks.bounded(351)) + 650) * side;
    const auto middle_z = (w.nodes[from].z_m + w.nodes[to].z_m) / 2;
    w.nodes.push_back({id, "landmark", label, x, middle_z});
    add_edge(std::string("branch/") + id + "/in", from, index, false, "gravel");
    add_edge(std::string("branch/") + id + "/out", index, to, false, "gravel");
  };
  // Topology varies by reconnection as well as by spatial layout.
  const auto reconnect = static_cast<std::size_t>(topology.bounded(2) + 3);
  add_branch("landmark/lookout", "The Listening Hill", 1, reconnect, -direction);
  add_branch("landmark/relay", "Silent Relay", 3, 5, direction);
  if (topology.bounded(2) == 1) add_branch("landmark/quarry", "Flooded Quarry", 2, 4, direction);
  return w;
}
} // namespace

bool normalize_seed(std::string_view raw, std::string& normalized, std::string& error) {
  error.clear(); normalized.clear();
  if (raw.size() > 256) { error = "Seed input exceeds 256 UTF-8 bytes."; return false; }
  while (!raw.empty() && ascii_space(static_cast<unsigned char>(raw.front()))) raw.remove_prefix(1);
  while (!raw.empty() && ascii_space(static_cast<unsigned char>(raw.back()))) raw.remove_suffix(1);
  if (raw.empty() || raw.size() > max_seed_bytes) { error = "Enter a seed containing 1 to 128 UTF-8 bytes."; return false; }
  if (!valid_utf8(raw)) { error = "Seed must be valid UTF-8 without control characters."; return false; }
  normalized = raw;
  return true;
}
RandomStream::RandomStream(std::string_view seed, std::string_view domain, std::uint32_t attempt) {
  const std::string key = std::string(generator_version) + "/" + std::to_string(seed.size()) + ":" + std::string(seed)
    + "/" + std::to_string(domain.size()) + ":" + std::string(domain) + "/attempt/" + std::to_string(attempt);
  state_ = hash32(key);
  if (state_ == 0) state_ = 0x6d2b79f5u;
}
std::uint32_t RandomStream::next() {
  state_ ^= state_ << 13u; state_ ^= state_ >> 17u; state_ ^= state_ << 5u;
  return state_;
}
std::uint32_t RandomStream::bounded(std::uint32_t bound) {
  if (bound == 0) return 0;
  const std::uint32_t threshold = (0u - bound) % bound;
  auto value = next();
  while (value < threshold) value = next();
  return value % bound;
}

std::vector<std::string> validate(const WorldManifest& w) {
  std::vector<std::string> errors;
  auto fail = [&errors](std::string message) { errors.push_back(std::move(message)); };
  if (w.schema != schema_version || w.generator != generator_version) fail("Unsupported schema or generator version.");
  std::string normalized, seed_error;
  if (!normalize_seed(w.seed, normalized, seed_error) || normalized != w.seed || w.seed_hash != hash32(w.seed)) fail("Invalid seed identity.");
  if (w.nodes.size() < 9 || w.nodes.size() > 10 || w.edges.size() < 10 || w.edges.size() > 12) fail("Graph outside bounded content budget.");
  if (w.attempt >= 8) fail("Attempt exceeds retry budget.");
  if (w.palette != "coastal-indigo" && w.palette != "pine-emerald" && w.palette != "moor-amber") fail("Unknown palette.");
  if (w.weather != "clear" && w.weather != "low-fog" && w.weather != "drizzle") fail("Unknown weather.");
  std::map<std::string, const Node*> nodes;
  std::map<std::string, int> roles;
  for (const auto& node : w.nodes) {
    if (node.id.empty() || !nodes.emplace(node.id, &node).second) fail("Duplicate or empty node ID.");
    if (node.role != "start" && node.role != "destination" && node.role != "service" && node.role != "landmark" && node.role != "junction" && node.role != "approach") fail("Unknown node role.");
    ++roles[node.role];
    if (node.x_m < -20000 || node.x_m > 20000 || node.z_m < 0 || node.z_m > 20000) fail("Node outside region bounds.");
  }
  for (const auto* role : {"start", "destination", "service", "approach"}) if (roles[role] != 1) fail(std::string("Expected one ") + role + ".");
  if (roles["landmark"] < 2 || roles["landmark"] > 3) fail("Expected two or three landmarks.");
  for (std::size_t i = 0; i < w.nodes.size(); ++i) for (std::size_t j = i+1; j < w.nodes.size(); ++j) {
    const auto dx = static_cast<std::int64_t>(w.nodes[i].x_m) - w.nodes[j].x_m;
    const auto dz = static_cast<std::int64_t>(w.nodes[i].z_m) - w.nodes[j].z_m;
    // Bound before multiplication to keep corrupted input safe.
    if (dx > -200 && dx < 200 && dz > -200 && dz < 200 && dx*dx + dz*dz < 40000) fail("Node exclusion radius violated.");
  }
  std::map<std::string, std::vector<std::string>> adjacent, main_next;
  std::map<std::string, int> main_in;
  std::set<std::string> edge_ids, pairs;
  std::uint64_t total = 0;
  for (const auto& edge : w.edges) {
    if (edge.id.empty() || !edge_ids.insert(edge.id).second) fail("Duplicate or empty edge ID.");
    if (!nodes.contains(edge.from) || !nodes.contains(edge.to) || edge.from == edge.to) { fail("Invalid edge endpoint."); continue; }
    const auto pair = std::min(edge.from, edge.to) + ":" + std::max(edge.from, edge.to);
    if (!pairs.insert(pair).second) fail("Duplicate road connection.");
    if (edge.length_m < 100 || edge.length_m > 3500) fail("Road length outside budget.");
    if (edge.surface != "asphalt" && edge.surface != "gravel") fail("Unknown surface.");
    const auto& a = *nodes[edge.from]; const auto& b = *nodes[edge.to];
    if (a.x_m >= -20000 && a.x_m <= 20000 && a.z_m >= 0 && a.z_m <= 20000 && b.x_m >= -20000 && b.x_m <= 20000 && b.z_m >= 0 && b.z_m <= 20000 && edge.length_m != distance(a,b)) fail("Road distance does not match graph coordinates.");
    adjacent[edge.from].push_back(edge.to); adjacent[edge.to].push_back(edge.from);
    if (edge.main_route) { total += edge.length_m; main_next[edge.from].push_back(edge.to); ++main_in[edge.to]; }
  }
  if (total != w.main_route_length_m || total < 3900 || total > 6500) fail("Main route length outside 3.9–6.5 km budget.");
  if (!nodes.contains("start") || !nodes.contains("destination") || !nodes.contains("service") || !nodes.contains("approach")) { fail("Missing required semantic anchors."); return errors; }
  if (nodes["start"]->role != "start" || nodes["destination"]->role != "destination" || nodes["service"]->role != "service" || nodes["approach"]->role != "approach") fail("Required anchor role mismatch.");
  std::set<std::string> visited;
  std::vector<std::string> pending{"start"};
  while (!pending.empty()) {
    auto id = pending.back(); pending.pop_back();
    if (!visited.insert(id).second) continue;
    for (const auto& next : adjacent[id]) pending.push_back(next);
  }
  if (visited.size() != nodes.size()) fail("Disconnected graph.");
  if (w.edges.size() < w.nodes.size() + 1) fail("Missing two reconnecting branches.");
  for (const auto& n : w.nodes) if (n.role == "landmark" && adjacent[n.id].size() != 2) fail("Landmark branch must reconnect.");
  // Directed main spine must be one chain, with service and a choice before midpoint.
  std::set<std::string> main_seen;
  std::string current = "start", previous;
  std::uint32_t progress = 0;
  bool service_early = false, choice_early = false;
  while (main_seen.insert(current).second && current != "destination") {
    if (current == "service" && progress < total / 2) service_early = true;
    if (adjacent[current].size() >= 3 && progress < total / 2) choice_early = true;
    if (main_next[current].size() != 1 || (current != "start" && main_in[current] != 1)) break;
    const auto next = main_next[current].front();
    for (const auto& e : w.edges) if (e.main_route && e.from == current && e.to == next) progress += e.length_m;
    previous = current; current = next;
  }
  if (current != "destination" || previous != "approach" || main_in["start"] != 0 || main_in["destination"] != 1 || !main_next["destination"].empty() || progress != total) fail("Invalid main spine or final approach.");
  if (!service_early || !choice_early) fail("Service and a route choice must precede midpoint.");
  return errors;
}
GenerationResult generate(std::string_view raw) {
  std::string seed, error;
  if (!normalize_seed(raw, seed, error)) return {{}, {error}};
  GenerationResult result;
  for (std::uint32_t attempt = 0; attempt < 8; ++attempt) {
    result.world = candidate(seed, attempt);
    result.errors = validate(result.world);
    if (result.ok()) return result;
  }
  result.errors.insert(result.errors.begin(), "No valid graph within 8 deterministic attempts.");
  return result;
}
std::string escape_json(std::string_view text) {
  std::string out = "\"";
  constexpr char hex[] = "0123456789abcdef";
  for (char byte : text) {
    const auto c = static_cast<unsigned char>(byte);
    if (c == '"' || c == '\\') { out += '\\'; out += static_cast<char>(c); }
    else if (c < 0x20u) { out += "\\u00"; out += hex[c >> 4u]; out += hex[c & 15u]; }
    else out += static_cast<char>(c);
  }
  return out + '"';
}
std::string canonical_json(const WorldManifest& w) {
  auto q = [](std::string_view v) { return escape_json(v); };
  std::string out = "{\"schemaVersion\":" + std::to_string(w.schema) + ",\"generatorVersion\":" + q(w.generator)
    + ",\"seed\":" + q(w.seed) + ",\"seedHash\":" + std::to_string(w.seed_hash) + ",\"attempt\":" + std::to_string(w.attempt)
    + ",\"palette\":" + q(w.palette) + ",\"weather\":" + q(w.weather) + ",\"mainRouteLengthM\":" + std::to_string(w.main_route_length_m) + ",\"nodes\":[";
  for (std::size_t i = 0; i < w.nodes.size(); ++i) {
    const auto& n = w.nodes[i]; if (i) out += ',';
    out += "{\"id\":" + q(n.id) + ",\"role\":" + q(n.role) + ",\"label\":" + q(n.label)
      + ",\"xM\":" + std::to_string(n.x_m) + ",\"zM\":" + std::to_string(n.z_m) + '}';
  }
  out += "],\"edges\":[";
  for (std::size_t i = 0; i < w.edges.size(); ++i) {
    const auto& e = w.edges[i]; if (i) out += ',';
    out += "{\"id\":" + q(e.id) + ",\"from\":" + q(e.from) + ",\"to\":" + q(e.to) + ",\"surface\":" + q(e.surface)
      + ",\"lengthM\":" + std::to_string(e.length_m) + ",\"mainRoute\":" + (e.main_route ? "true" : "false") + '}';
  }
  return out + "]}";
}
std::string envelope_json(const WorldManifest& w) {
  const auto payload = canonical_json(w);
  return "{\"apiVersion\":1,\"manifestHash\":\"" + hash64(payload) + "\",\"manifest\":" + payload + '}';
}
} // namespace night

