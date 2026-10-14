#include "night/vehicle.hpp"
#include "drive_fixture.hpp"
#include <cstdlib>
#include <iostream>
#include <limits>

int checks=0;
void check(bool pass,const char* message) { ++checks;if(!pass){std::cerr<<"FAIL: "<<message<<'\n';std::exit(1);} }
int main() {
  using namespace night::drive;
  Vehicle v;
  for(int i=0;i<600;++i)v.tick({});
  check(std::abs(v.state.position.y-0.778f)<0.02f,"static spring equilibrium");
  check(length(v.state.velocity)<0.02f,"rest stability");
  check(v.snapshot()[20]==4,"four wheel contacts at rest");
  for(int i=0;i<180;++i)v.tick({1,0,0,false,false});
  check(v.state.speed>8,"engine accelerates chassis");
  const float before=v.state.distance;
  for(int i=0;i<180;++i)v.tick({0,1,0,false,false});
  check(std::abs(v.state.speed)<0.15f,"braking stops car without reversing");
  check(v.state.distance-before<35,"reasonable braking distance");
  for(int i=0;i<120;++i)v.tick({0.5f,0,0,true,false});
  check(v.state.speed< -2,"explicit reverse");
  v.recover();check(length(v.state.velocity)==0&&v.state.recoveries==1,"recovery is stationary");
  v.reset();check(v.state.ticks==0&&v.state.recoveries==0,"reset clears session");
  for(int i=0;i<120;++i)v.tick({0.5f,0,0,false,false});
  for(int i=0;i<30;++i)v.tick({0.5f,0,1,false,false});
  check(v.state.position.x<55&&v.state.orientation.rotate({0,0,1}).x<0,"right input turns driver-right (-X)");
  v.reset();
  v.tick({std::numeric_limits<float>::quiet_NaN(),0,std::numeric_limits<float>::infinity(),false,false});
  check(std::isfinite(v.state.position.x),"nonfinite inputs sanitized");
  // High-speed, oblique guardrail impact must remain inside the analytic bounds.
  v.reset();v.state.velocity={90,0,10};v.tick({});
  check(std::abs(nearest_road(v.state.position.x,v.state.position.z).offset)<9,"swept guardrail boundary");
  for(int i=0;i<120;++i)v.tick({});
  check(v.state.impacts>0,"guardrail impact registered");
  v.state.orientation={0,0,1,0};v.state.position.y=0.3f;
  for(int i=0;i<120;++i)v.tick({});
  v.recover();check(v.state.orientation.rotate({0,1,0}).y>0.99f,"rollover recovery");
  for(int i=0;i<648;++i) {
    const auto r=road_at(static_cast<float>(i));const auto n=nearest_road(r.center.x,r.center.z);
    check(std::abs(n.offset)<0.001f,"track sample/collider agreement");
  }
  v.reset();float max_speed=0,min_up=1;int gravel=0,airborne=0;
  for(int i=0;i<42000&&v.state.laps<10;++i) {
    v.tick(lap_input(v)); const auto a=v.snapshot();
    for(float f:a)check(std::isfinite(f),"finite stress snapshot");
    max_speed=std::max(max_speed,std::abs(v.state.speed));min_up=std::min(min_up,a[40]);
    if(a[19]==1)++gravel;if(a[20]==0)++airborne;
  }
  std::cout<<"Laps "<<v.state.laps<<", impacts "<<v.state.impacts<<", min up "<<min_up<<", max m/s "<<max_speed<<", gravel ticks "<<gravel<<", airborne "<<airborne<<'\n';
  check(v.state.laps==10,"ten consecutive test-driver laps");
  check(v.state.impacts==0&&v.state.recoveries==0,"no collisions or recovery on laps");
  check(min_up>0.9f,"no spontaneous rollovers");
  check(gravel>100,"gravel traversed");
  Vehicle same;
  v.reset();for(int i=0;i<3600;++i){const auto in=replay_input(i);v.tick(in);same.tick(in);}
  check(v.snapshot()==same.snapshot(),"same fixed input replay repeats exactly in one build");
  // Reverse start-line crossing cannot award laps.
  v.reset();for(int i=0;i<120;++i)v.tick({0.3f,0,0,true,false});check(v.state.laps==0,"reverse is not lap credit");
  std::cout<<checks<<" vehicle checks passed\n";
}
