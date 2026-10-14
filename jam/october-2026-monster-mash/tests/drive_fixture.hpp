#pragma once
#include "night/vehicle.hpp"
#include <algorithm>
// Test driver only: pursuit controller outputs ordinary player forces, never poses.
inline night::drive::Input lap_input(const night::drive::Vehicle& car) {
  using namespace night::drive;
  const auto& s=car.state;
  const float look=8+std::abs(s.speed)*0.5f;
  const Vec3 target=road_at(s.progress+look).center;
  const Vec3 local=s.orientation.inverse(target-s.position);
  const float angle=std::atan2(local.x,local.z);
  const float target_speed=14;
  const float steer=-std::atan(2*2.6f*std::sin(angle)/look)*(1+std::abs(s.speed)*0.065f)/car.params.max_steer;
  return {std::clamp((target_speed-s.speed)*0.4f,0.0f,0.7f),std::clamp((s.speed-target_speed)*0.3f,0.0f,1.0f),std::clamp(steer,-1.0f,1.0f),false,false};
}
inline night::drive::Input replay_input(int tick) {
  const int phase=tick%900;
  return {phase<420?0.55f:0.0f,phase>=420&&phase<600?0.7f:0.0f,
          phase>=100&&phase<390?-0.16f:0.0f,phase>=650,false};
}
