#include "night/vehicle.hpp"
#include <array>
#include <cstdint>

namespace {
night::drive::Vehicle car;
std::array<float,8> input{1,0,0,0,0,0,0,0};
std::array<float,64> snapshot=car.snapshot();
// Authored track sampled by C++; browser consumes geometry, never defines collision facts.
constexpr std::size_t samples=648;
std::array<float,(samples+1)*8> track{};
}
extern "C" {
std::uint32_t nr_drive_version() { return 1; }
float* nr_drive_input() { return input.data(); }
const float* nr_drive_snapshot() { return snapshot.data(); }
std::uint32_t nr_drive_step() {
  if(input[0]!=1) return 1;
  car.tick({input[1],input[2],input[3],input[4]>0.5f,input[5]>0.5f});
  snapshot=car.snapshot(); return 0;
}
void nr_drive_reset() { car.reset();input={1,0,0,0,0,0,0,0};snapshot=car.snapshot(); }
void nr_drive_recover() { car.recover();snapshot=car.snapshot(); }
std::uint32_t nr_track_count() { return static_cast<std::uint32_t>(samples+1); }
const float* nr_track_data() {
  for(std::size_t i=0;i<=samples;++i) {
    const float s=night::drive::track_length*static_cast<float>(i)/static_cast<float>(samples);
    const auto r=night::drive::road_at(s); const std::size_t j=i*8;
    track[j]=r.center.x;track[j+1]=r.center.y;track[j+2]=r.center.z;
    track[j+3]=r.outward.x;track[j+4]=r.outward.z;track[j+5]=s;
    track[j+6]=static_cast<float>(r.surface);track[j+7]=6;
  }
  return track.data();
}
}
