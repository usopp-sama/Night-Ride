#include "night/vehicle.hpp"
#include <algorithm>
#include <cassert>

namespace night::drive {
namespace {
float wrap(float s) { s=std::fmod(s,track_length); return s<0?s+track_length:s; }
float hump(float s,float start,float end,float height) {
  if(s<=start||s>=end) return 0;
  return height*0.5f*(1-std::cos(2*pi*(s-start)/(end-start)));
}
float elevation(float s) { return hump(s,145,330,4)+hump(s,55,63,0.14f); }
float clean(float v,float lo,float hi) { return std::isfinite(v)?std::clamp(v,lo,hi):0; }
constexpr std::array<Vec3,4> mounts{{{-0.78f,0,1.3f},{0.78f,0,1.3f},{-0.78f,0,-1.3f},{0.78f,0,-1.3f}}};
constexpr std::array<float,5> gears{3.2f,2.1f,1.45f,1.05f,0.82f};
}
void Quat::integrate(Vec3 omega) {
  const Vec3 q{x,y,z}, d=(omega*w+cross(omega,q))*(0.5f*dt);
  w-=dot(omega,q)*0.5f*dt; x+=d.x; y+=d.y; z+=d.z;
  const float n=std::sqrt(x*x+y*y+z*z+w*w); x/=n; y/=n; z/=n; w/=n;
}
RoadPoint road_at(float distance,float offset) {
  float s=wrap(distance); Vec3 c{},n{};
  if(s<150) { c={55,0,-75+s}; n={1,0,0}; }
  else if(s<150+55*pi) { const float a=(s-150)/55; n={std::cos(a),0,std::sin(a)}; c={55*n.x,0,75+55*n.z}; }
  else if(s<300+55*pi) { c={-55,0,75-(s-150-55*pi)}; n={-1,0,0}; }
  else { const float a=pi+(s-300-55*pi)/55; n={std::cos(a),0,std::sin(a)}; c={55*n.x,0,-75+55*n.z}; }
  c+=n*offset; c.y=elevation(s);
  return {c,n,s,offset,(s>=340&&s<440)?1:0};
}
RoadPoint nearest_road(float x,float z) {
  const float cz=std::clamp(z,-75.0f,75.0f);
  const Vec3 radial{x,0,z-cz}; const float r=length(radial);
  const Vec3 n=r>0.0001f?radial*(1/r):Vec3{1,0,0};
  float s=0;
  if(z>75) { float a=std::atan2(z-75,x); s=150+55*a; }
  else if(z<-75) { float a=std::atan2(z+75,x); if(a<0)a+=2*pi; s=300+55*pi+55*(a-pi); }
  else s=x>=0?z+75:150+55*pi+75-z;
  return {{55*n.x,elevation(wrap(s)),cz+55*n.z},n,wrap(s),r-55,(s>=340&&s<440)?1:0};
}
float ground_height(float x,float z) { return nearest_road(x,z).center.y; }
Vec3 ground_normal(float x,float z) {
  constexpr float e=0.05f;
  return unit({ground_height(x-e,z)-ground_height(x+e,z),2*e,ground_height(x,z-e)-ground_height(x,z+e)});
}
void Vehicle::place(float distance) {
  auto r=road_at(distance); state.position=r.center+Vec3{0,0.78f,0};
  const float yaw=std::atan2(-r.outward.z,r.outward.x);
  state.orientation={0,std::sin(yaw/2),0,std::cos(yaw/2)};
  state.velocity={}; state.omega={}; state.steering=0; state.throttle=0; state.speed=0;
  state.rpm=850; state.gear=1; state.wheels={}; state.progress=r.progress;
  for(auto& wheel:state.wheels) wheel.travel=params.rest-params.mass*9.81f/(4*params.spring);
  last_progress_=r.progress; shift_timer_=0;
}
void Vehicle::reset() { state={}; forward_progress_=0; place(0); }
void Vehicle::recover() {
  // The analytic loop always has a safe centerline; recovery never advances lap credit.
  ++state.recoveries; place(state.progress);
}
void Vehicle::tick(Input input) {
  input.throttle=clean(input.throttle,0,1); input.brake=clean(input.brake,0,1); input.steer=clean(input.steer,-1,1);
  auto& s=state; const auto& p=params;
  const Vec3 forward=s.orientation.rotate({0,0,1}), up=s.orientation.rotate({0,1,0});
  s.speed=dot(s.velocity,forward);
  s.throttle+=(input.throttle-s.throttle)*std::min(1.0f,dt*6);
  // +Z is forward, so screen/driver-right is -X in this right-handed coordinate system.
  const float steer_target=-input.steer*p.max_steer/(1+std::abs(s.speed)*0.065f);
  s.steering+=std::clamp(steer_target-s.steering,-dt*1.6f,dt*1.6f);
  // Reverse is explicit and only engages near rest; brakes never automatically reverse.
  if(std::abs(s.speed)<0.6f) { if(input.reverse) s.gear=-1; else if(s.gear<0) s.gear=1; }
  float ratio=s.gear<0?3.0f:gears[static_cast<std::size_t>(s.gear-1)];
  s.rpm=std::max(850.0f,std::abs(s.speed)/p.wheel_radius*ratio*p.final_drive*60/(2*pi));
  shift_timer_=std::max(0.0f,shift_timer_-dt);
  if(s.gear>0&&shift_timer_==0) {
    if(s.rpm>4900&&s.gear<5) { ++s.gear; shift_timer_=0.45f; }
    else if(s.rpm<1700&&s.gear>1) { --s.gear; shift_timer_=0.45f; }
    ratio=gears[static_cast<std::size_t>(s.gear-1)];
  }
  const float torque=std::clamp(210.0f-std::abs(s.rpm-3200)*0.025f,100.0f,210.0f);
  const float engine=s.rpm>6200?0:torque*ratio*p.final_drive*0.86f/p.wheel_radius*s.throttle*(s.gear<0?-1.0f:1.0f);
  Vec3 force={0,-p.mass*9.81f,0}, moment{};
  auto apply=[&](Vec3 f,Vec3 arm) { force+=f; moment+=cross(arm,f); };
  for(std::size_t i=0;i<4;++i) {
    auto& w=s.wheels[i]; w={}; w.travel=p.rest;
    const Vec3 arm=s.orientation.rotate(mounts[i]), origin=s.position+arm;
    if(up.y<0.3f) continue;
    // Ray along chassis down; solve heightfield intersection with bounded iterations.
    float ray=(origin.y-ground_height(origin.x,origin.z)-p.wheel_radius)/up.y;
    for(int n=0;n<3;++n) { const Vec3 hit=origin-up*ray; ray+=(hit.y-ground_height(hit.x,hit.z)-p.wheel_radius)/up.y; }
    if(ray>p.rest||ray< -0.5f) continue;
    w.contact=true; w.travel=std::clamp(ray,0.0f,p.rest);
    const Vec3 contact_arm=arm-up*ray, contact=s.position+contact_arm;
    const Vec3 normal=ground_normal(contact.x,contact.z);
    const Vec3 velocity=s.velocity+cross(s.omega,contact_arm);
    w.load=std::clamp(p.spring*(p.rest-ray)-p.damper*dot(velocity,normal),0.0f,p.mass*9.81f);
    apply(normal*w.load,contact_arm);
    const float steer=i<2?s.steering:0;
    Vec3 along=s.orientation.rotate({std::sin(steer),0,std::cos(steer)});
    along=unit(along-normal*dot(along,normal)); const Vec3 right=unit(cross(normal,along));
    const float longitudinal=dot(velocity,along), lateral=dot(velocity,right);
    const auto road=nearest_road(contact.x,contact.z);
    const bool shoulder=std::abs(road.offset)>6;
    const float grip=shoulder?0.45f:(road.surface==1?0.64f:1.05f);
    const float rolling=shoulder?0.10f:(road.surface==1?0.045f:p.rolling);
    const float brake=input.brake*p.brake_force/4+(input.handbrake&&i>=2?4000.0f:0);
    float fx=engine/4-std::clamp(longitudinal*p.mass/(4*dt),-brake,brake)-std::clamp(longitudinal*300,-rolling*w.load,rolling*w.load);
    float fy=-lateral*p.corner_stiffness*(input.handbrake&&i>=2?0.3f:1.0f);
    const float magnitude=std::hypot(fx,fy), limit=grip*w.load;
    w.slip=std::abs(lateral)/std::max(1.0f,std::abs(longitudinal));
    if(magnitude>limit&&magnitude>0) { fx*=limit/magnitude; fy*=limit/magnitude; }
    apply(along*fx+right*fy,contact_arm);
  }
  force+=s.velocity*(-p.drag*length(s.velocity));
  // Passive rotational damping models suspension/bushing losses, not a pose assist.
  moment+=s.omega*(-350.0f);
  s.velocity+=force*(dt/p.mass); s.position+=s.velocity*dt;
  Vec3 local_w=s.orientation.inverse(s.omega), local_t=s.orientation.inverse(moment);
  const Vec3 iw{p.inertia.x*local_w.x,p.inertia.y*local_w.y,p.inertia.z*local_w.z};
  local_t=local_t-cross(local_w,iw);
  s.omega+=s.orientation.rotate({local_t.x/p.inertia.x,local_t.y/p.inertia.y,local_t.z/p.inertia.z})*dt;
  s.orientation.integrate(s.omega);
  // Chassis corners prevent ground penetration even when upside down.
  float penetration=0;
  for(float x:{-0.85f,0.85f}) for(float y:{-0.18f,0.65f}) for(float z:{-1.7f,1.7f}) {
    const Vec3 c=s.position+s.orientation.rotate({x,y,z});
    penetration=std::max(penetration,ground_height(c.x,c.z)-c.y);
  }
  if(penetration>0) { s.position.y+=penetration; if(s.velocity.y<0)s.velocity.y=0; s.omega=s.omega*0.92f; s.velocity.x*=0.98f;s.velocity.z*=0.98f; }
  auto road=nearest_road(s.position.x,s.position.z);
  // Analytic signed-distance boundary catches crossing without discrete wall sampling.
  // Body projection varies with orientation so the visible chassis cannot pass the rail.
  const Vec3 side=s.orientation.rotate({1,0,0}), f=s.orientation.rotate({0,0,1});
  const float extent=std::abs(dot(side,road.outward))*0.9f+std::abs(dot(f,road.outward))*1.9f;
  const float bound=9-extent;
  if(std::abs(road.offset)>bound) {
    const float sign=road.offset>0?1.0f:-1.0f; const Vec3 n=road.outward*sign;
    s.position+=n*(-(std::abs(road.offset)-bound));
    const float toward=dot(s.velocity,n);
    if(toward>0) { s.velocity+=n*(-1.05f*toward); s.velocity=s.velocity*0.92f; if(toward>1)++s.impacts; }
  }
  road=nearest_road(s.position.x,s.position.z); s.progress=road.progress;
  float delta=s.progress-last_progress_;
  if(delta>track_length/2)delta-=track_length; if(delta< -track_length/2)delta+=track_length;
  forward_progress_+=delta; last_progress_=s.progress;
  s.distance+=length(s.velocity)*dt; s.lap_time+=dt;
  if(forward_progress_>=track_length) { ++s.laps;forward_progress_-=track_length;s.last_lap=s.lap_time;s.lap_time=0; }
  s.speed=dot(s.velocity,s.orientation.rotate({0,0,1})); ++s.ticks;
  assert(std::isfinite(s.position.x)&&std::isfinite(s.position.y)&&std::isfinite(s.position.z));
}
std::array<float,64> Vehicle::snapshot() const {
  const auto& s=state; const auto q=s.orientation; std::array<float,64> a{};
  a[0]=1;a[1]=static_cast<float>(s.ticks);
  a[2]=s.position.x;a[3]=s.position.y;a[4]=s.position.z;
  a[5]=q.x;a[6]=q.y;a[7]=q.z;a[8]=q.w;
  a[9]=s.velocity.x;a[10]=s.velocity.y;a[11]=s.velocity.z;
  a[12]=s.omega.x;a[13]=s.omega.y;a[14]=s.omega.z;
  a[15]=s.speed;a[16]=s.rpm;a[17]=static_cast<float>(s.gear);a[18]=s.steering;
  const auto r=nearest_road(s.position.x,s.position.z); a[19]=std::abs(r.offset)>6?2.0f:static_cast<float>(r.surface);
  for(std::size_t i=0;i<4;++i) {a[20]+=s.wheels[i].contact?1.0f:0.0f;a[28+i]=s.wheels[i].travel;a[32+i]=s.wheels[i].load;a[36+i]=s.wheels[i].slip;}
  a[21]=s.progress;a[22]=static_cast<float>(s.laps);a[23]=s.lap_time;a[24]=s.last_lap;
  a[25]=static_cast<float>(s.recoveries);a[26]=static_cast<float>(s.impacts);
  const auto local=s.orientation.inverse(s.omega);
  a[27]=0.5f*(params.mass*dot(s.velocity,s.velocity)+params.inertia.x*local.x*local.x+params.inertia.y*local.y*local.y+params.inertia.z*local.z*local.z);
  a[40]=q.rotate({0,1,0}).y;a[41]=s.distance;a[42]=track_length;a[43]=s.throttle;
  return a;
}
}
