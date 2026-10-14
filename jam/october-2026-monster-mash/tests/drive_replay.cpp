#include "drive_fixture.hpp"
#include <iomanip>
#include <iostream>
int main() {
  night::drive::Vehicle car;
  std::cout<<std::setprecision(9)<<'[';
  for(int i=0;i<3600;++i) {
    car.tick(replay_input(i));
    if((i+1)%60==0){if(i>=60)std::cout<<',';std::cout<<'[';const auto s=car.snapshot();for(std::size_t j=0;j<s.size();++j){if(j)std::cout<<',';std::cout<<s[j];}std::cout<<']';}
  }
  std::cout<<"]\n";
}
