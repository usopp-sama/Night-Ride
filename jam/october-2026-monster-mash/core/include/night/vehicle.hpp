#pragma once
#include <array>
#include <cmath>
#include <cstdint>

namespace night::drive {
constexpr float dt = 1.0f / 60.0f;
constexpr float pi = 3.14159265358979323846f;
constexpr float track_length = 300.0f + 110.0f * pi;
struct Vec3 {
  float x{}, y{}, z{};
  Vec3 operator+(Vec3 b) const { return {x+b.x,y+b.y,z+b.z}; }
  Vec3 operator-(Vec3 b) const { return {x-b.x,y-b.y,z-b.z}; }
  Vec3 operator*(float k) const { return {x*k,y*k,z*k}; }
  Vec3& operator+=(Vec3 b) { *this=*this+b; return *this; }
};
inline float dot(Vec3 a,Vec3 b) { return a.x*b.x+a.y*b.y+a.z*b.z; }
inline Vec3 cross(Vec3 a,Vec3 b) { return {a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x}; }
inline float length(Vec3 a) { return std::sqrt(dot(a,a)); }
inline Vec3 unit(Vec3 a) { const float n=length(a); return n>0.00001f?a*(1/n):Vec3{0,1,0}; }
struct Quat {
  float x{}, y{}, z{}, w{1};
  Vec3 rotate(Vec3 v) const { Vec3 q{x,y,z}; return v+cross(q,v)*(2*w)+cross(q,cross(q,v))*2; }
  Vec3 inverse(Vec3 v) const { return Quat{-x,-y,-z,w}.rotate(v); }
  void integrate(Vec3 omega);
};
struct RoadPoint { Vec3 center; Vec3 outward; float progress{}, offset{}; int surface{}; };
RoadPoint road_at(float distance, float offset=0);
RoadPoint nearest_road(float x,float z);
float ground_height(float x,float z);
Vec3 ground_normal(float x,float z);
// A bounded heightfield and two continuous analytic guardrails. No mesh collision engine.
struct Parameters {
  float mass=1200, spring=32000, damper=3200, rest=0.55f, wheel_radius=0.32f;
  Vec3 inertia{1800,2200,800};
  float brake_force=12000, corner_stiffness=1900, drag=0.48f, rolling=0.018f;
  float max_steer=0.48f, final_drive=3.7f;
};
struct Input { float throttle{}, brake{}, steer{}; bool reverse{}, handbrake{}; };
struct Wheel { float travel{}, load{}, slip{}; bool contact{}; };
struct State {
  Vec3 position{55,0.78f,-75}, velocity{}, omega{};
  Quat orientation{};
  std::array<Wheel,4> wheels{};
  float steering{}, throttle{}, rpm=850, speed{}, progress{}, distance{}, lap_time{}, last_lap{};
  int gear=1, laps=0, impacts=0, recoveries=0;
  std::uint32_t ticks=0;
};
class Vehicle {
 public:
  Parameters params;
  State state;
  Vehicle() { reset(); }
  void reset();
  void recover();
  void tick(Input input);
  std::array<float,64> snapshot() const;
 private:
  float last_progress_=0, forward_progress_=0, shift_timer_=0;
  void place(float distance);
};
// Simulation ABI 1: all slots float32, including version/count values.
// Input[8]: version=1, throttle, brake, steer (-1 left/+1 right), reverse, handbrake, reserved*2.
// Snapshot[64]: version, tick, pos[3], quaternion xyzw[4], velocity[3], omega[3],
// signed speed m/s, RPM, gear, steering, surface, contact count, progress m,
// laps, lap seconds, last lap seconds, recoveries, impacts, energy joules,
// wheel travel[4], wheel load[4], wheel slip[4], upright dot, total distance,
// track length, throttle; remaining slots reserved zero. Copy after each tick.
}
