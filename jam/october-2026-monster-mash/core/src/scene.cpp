#include "night/world.hpp"
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <sstream>
#include <unordered_map>

// Seeded 3D landscape preview built from the validated graph manifest.
// Rendering consumes this JSON; it never decides world facts itself.
namespace {
struct P { float x,y,z; };
struct Lake { float x,z,rx,rz,level; };
struct RoadHit { float distance, y; };
std::string scene_json;

float base_height(float x,float z) { return 3+5*std::sin(z/310.0f)+3*std::sin(x/190.0f)*std::cos(z/240.0f); }
float smooth(float edge0,float edge1,float v) { const float t=std::clamp((v-edge0)/(edge1-edge0),0.0f,1.0f); return t*t*(3-2*t); }

// Value noise on an integer lattice; the per-world salt comes from the seed stream.
std::uint32_t lattice_hash(std::int32_t x,std::int32_t z,std::uint32_t salt) {
  std::uint32_t h=salt^static_cast<std::uint32_t>(x)*0x27d4eb2du^static_cast<std::uint32_t>(z)*0x165667b1u;
  h^=h>>15;h*=0x85ebca6bu;h^=h>>13;h*=0xc2b2ae35u;h^=h>>16;return h;
}
float value_noise(float x,float z,std::uint32_t salt) {
  const float fx=std::floor(x),fz=std::floor(z),tx=x-fx,tz=z-fz;
  const auto ix=static_cast<std::int32_t>(fx),iz=static_cast<std::int32_t>(fz);
  auto corner=[&](std::int32_t dx,std::int32_t dz){return static_cast<float>(lattice_hash(ix+dx,iz+dz,salt)&0xffffu)/65535.0f*2-1;};
  const float sx=tx*tx*(3-2*tx),sz=tz*tz*(3-2*tz);
  const float a=corner(0,0)+(corner(1,0)-corner(0,0))*sx,b=corner(0,1)+(corner(1,1)-corner(0,1))*sx;
  return a+(b-a)*sz;
}

// Road samples bucketed on an 80 m grid; queries see 5x5 cells, so distances
// are exact up to 160 m and reported as 160 m beyond that.
class RoadIndex {
 public:
  static constexpr float cell=80, far=160;
  explicit RoadIndex(const std::vector<std::vector<P>>& roads) {
    for(const auto& road:roads) for(std::size_t i=1;i<road.size();++i) {
      const P a=road[i-1],b=road[i];
      const int x0=key(std::min(a.x,b.x)),x1=key(std::max(a.x,b.x)),z0=key(std::min(a.z,b.z)),z1=key(std::max(a.z,b.z));
      for(int cx=x0;cx<=x1;++cx) for(int cz=z0;cz<=z1;++cz) cells_[pack(cx,cz)].push_back({a,b});
    }
  }
  RoadHit nearest(float x,float z) const {
    RoadHit best{far,0};const int cx=key(x),cz=key(z);
    for(int i=-2;i<=2;++i) for(int j=-2;j<=2;++j) {
      const auto it=cells_.find(pack(cx+i,cz+j)); if(it==cells_.end()) continue;
      for(const auto& [a,b]:it->second) {
        const float dx=b.x-a.x,dz=b.z-a.z;
        const float t=std::clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz+0.0001f),0.0f,1.0f);
        const float d=std::hypot(x-a.x-t*dx,z-a.z-t*dz);
        if(d<best.distance) best={d,a.y+(b.y-a.y)*t};
      }
    }
    return best;
  }
 private:
  static int key(float v) { return static_cast<int>(std::floor(v/cell)); }
  static std::int64_t pack(int x,int z) { return (static_cast<std::int64_t>(x)<<32)^static_cast<std::uint32_t>(z); }
  std::unordered_map<std::int64_t,std::vector<std::pair<P,P>>> cells_;
};

struct Shape {
  std::uint32_t salt; float min_x,max_x,max_z; const RoadIndex* roads; std::vector<Lake> lakes;
  // Distance outside the road network's bounding box: mountains rise there.
  float outside(float x,float z) const { return std::max({min_x-x,x-max_x,-z,z-max_z,0.0f}); }
  float hills(float x,float z) const {
    return 26*value_noise(x/460,z/460,salt)+10*value_noise(x/180,z/180,salt+1)+2.5f*value_noise(x/55,z/55,salt+2);
  }
  float mountains(float x,float z) const {
    const float rise=smooth(80,1100,outside(x,z)+90*value_noise(x/700,z/700,salt+3));
    // Ridged peaks so the skyline never reads as a flat plateau.
    const float ridge=1-std::abs(value_noise(x/260,z/260,salt+5));
    return rise*(120+80*value_noise(x/520,z/520,salt+4)+110*ridge*ridge+18*value_noise(x/70,z/70,salt+6));
  }
  // Natural ground before lakes: the road corridor is graded flat and the land rises beyond it.
  float ground(float x,float z) const {
    const auto road=roads->nearest(x,z);
    const float natural=base_height(x,z)+hills(x,z)*smooth(25,160,road.distance)+mountains(x,z);
    return road.y-0.22f+(natural-(road.y-0.22f))*smooth(7,38,road.distance);
  }
  float height(float x,float z) const {
    float h=ground(x,z);
    for(const auto& l:lakes) {
      const float d=std::hypot((x-l.x)/l.rx,(z-l.z)/l.rz);
      if(d>1.45f) continue;
      const float bowl=l.level-1.2f-5.0f*(1-std::clamp(d,0.0f,1.0f)*std::clamp(d,0.0f,1.0f));
      h=bowl+(std::max(h,l.level+0.4f)-bowl)*smooth(0.86f,1.45f,d);
    }
    return h;
  }
  bool wet(float x,float z) const { for(const auto& l:lakes) if(std::hypot((x-l.x)/l.rx,(z-l.z)/l.rz)<1.12f) return true; return false; }
  // 0..1 forest cover: patchy woodland with meadows, thinning on high ridges.
  float forest(float x,float z) const {
    const float n=value_noise(x/380,z/380,salt+10)+0.35f*value_noise(x/120,z/120,salt+11);
    return smooth(-0.35f,0.3f,n)*(1-smooth(110,200,mountains(x,z)));
  }
};
}
extern "C" {
std::uint32_t nr_scene_generate(const char* input,std::uint32_t size) {
  scene_json.clear();if(!input||size>256)return 1;
  std::string seed,error;if(!night::normalize_seed({input,size},seed,error))return 1;
  auto result=night::generate(seed);if(!result.ok())return 2;
  const auto& world=result.world;night::RandomStream rng(seed,"scene-v2/decoration");
  night::RandomStream terrain_rng(seed,"scene-v2/terrain");
  auto random=[&](){return static_cast<float>(rng.bounded(100000))/100000.0f;};
  auto node=[&](const std::string& id)->const night::Node&{return *std::find_if(world.nodes.begin(),world.nodes.end(),[&](const auto& n){return n.id==id;});};
  std::vector<std::vector<P>> roads;
  float min_x=1e9f,max_x=-1e9f,max_z=0;
  for(const auto& edge:world.edges) {
    const auto& a=node(edge.from);const auto& b=node(edge.to);
    const float ax=static_cast<float>(a.x_m),az=static_cast<float>(a.z_m),bx=static_cast<float>(b.x_m),bz=static_cast<float>(b.z_m);
    const int count=std::max(12,static_cast<int>(edge.length_m/12));std::vector<P> points;
    // Smooth, monotone cubic embedding with north/south tangents at graph anchors.
    const float reach=std::min(std::abs(bz-az)*0.35f,180.0f),sign=bz>=az?1.0f:-1.0f;
    for(int i=0;i<=count;++i) {
      const float t=static_cast<float>(i)/static_cast<float>(count),u=1-t;
      const float x=u*u*u*ax+3*u*u*t*ax+3*u*t*t*bx+t*t*t*bx;
      const float z=u*u*u*az+3*u*u*t*(az+reach*sign)+3*u*t*t*(bz-reach*sign)+t*t*t*bz;
      points.push_back({x,base_height(x,z)+0.16f,z});min_x=std::min(min_x,x);max_x=std::max(max_x,x);max_z=std::max(max_z,z);
    }
    roads.push_back(std::move(points));
  }
  const RoadIndex index(roads);
  Shape shape{terrain_rng.bounded(0x7fffffffu),min_x,max_x,max_z,&index,{}};
  for(int attempt=0;attempt<50&&shape.lakes.size()<2;++attempt) {
    const float x=min_x-120+random()*(max_x-min_x+240),z=250+random()*(max_z-500);
    const float rx=65+random()*45,rz=85+random()*45;
    if(index.nearest(x,z).distance<=std::min(RoadIndex::far-1,std::max(rx,rz)*1.4f+18)) continue;
    // Water settles a little below the lowest ground sampled around the rim.
    float rim=1e9f;
    for(int k=0;k<16;++k){const float a=static_cast<float>(k)*0.3926991f;rim=std::min(rim,shape.ground(x+std::cos(a)*rx,z+std::sin(a)*rz));}
    shape.lakes.push_back({x,z,rx,rz,rim-0.6f});
  }
  constexpr int columns=200,rows=400;
  const float margin=1500,t_min_x=min_x-margin,t_max_x=max_x+margin,t_min_z=-margin,t_max_z=max_z+margin;
  std::ostringstream out;out<<std::fixed<<std::setprecision(2);
  out<<"{\"sceneVersion\":\"2-preview\",\"world\":"<<night::envelope_json(world)<<",\"roads\":[";
  for(std::size_t j=0;j<roads.size();++j) {
    if(j)out<<',';const auto& e=world.edges[j];out<<"{\"id\":"<<night::escape_json(e.id)<<",\"main\":"<<(e.main_route?"true":"false")<<",\"surface\":"<<night::escape_json(e.surface)<<",\"halfWidth\":"<<(e.main_route?5:3.8)<<",\"points\":[";
    for(std::size_t i=0;i<roads[j].size();++i){if(i)out<<',';auto p=roads[j][i];out<<'['<<p.x<<','<<p.y<<','<<p.z<<']';}out<<"]}";
  }
  out<<"],\"lakes\":[";for(std::size_t i=0;i<shape.lakes.size();++i){if(i)out<<',';auto l=shape.lakes[i];out<<'['<<l.x<<','<<l.level<<','<<l.z<<','<<l.rx<<','<<l.rz<<']';}
  out<<"],\"terrain\":{\"minX\":"<<t_min_x<<",\"maxX\":"<<t_max_x<<",\"minZ\":"<<t_min_z<<",\"maxZ\":"<<t_max_z<<",\"columns\":"<<columns<<",\"rows\":"<<rows<<",\"heights\":[";
  std::string cover;cover.reserve(static_cast<std::size_t>((columns+1)*(rows+1)));
  out<<std::setprecision(1);
  for(int row=0;row<=rows;++row)for(int col=0;col<=columns;++col){
    if(row||col)out<<',';
    const float x=t_min_x+(t_max_x-t_min_x)*static_cast<float>(col)/columns,z=t_min_z+(t_max_z-t_min_z)*static_cast<float>(row)/rows;
    out<<shape.height(x,z);
    cover.push_back(static_cast<char>('0'+std::clamp(static_cast<int>(shape.forest(x,z)*9.99f),0,9)));
  }
  // Forest cover per terrain vertex, one digit 0-9, for ground shading.
  out<<"],\"cover\":\""<<cover<<"\"},\"props\":[";
  out<<std::setprecision(2);
  // Kinds: 0 broadleaf tree, 1 conifer, 2 shrub, 3 rock.
  int placed=0;
  auto emit=[&](int kind,float x,float z,float scale,float yaw){
    if(placed++)out<<',';out<<'['<<kind<<','<<x<<','<<shape.height(x,z)<<','<<z<<','<<scale<<','<<yaw<<']';
  };
  // Roadside rows: inner row mixes all kinds, outer rows thicken into forest.
  for(std::size_t r=0;r<roads.size();++r)for(std::size_t i=0;i<roads[r].size();i+=2)for(int side:{-1,1})for(int layer=0;layer<3;++layer) {
    const auto p=roads[r][i],next=roads[r][std::min(i+1,roads[r].size()-1)];const float dx=next.x-p.x,dz=next.z-p.z,len=std::max(0.01f,std::hypot(dx,dz));
    const float offset=static_cast<float>(side)*(13+random()*30+static_cast<float>(layer)*28);
    const float x=p.x+dz/len*offset+(random()-0.5f)*14,z=p.z-dx/len*offset+(random()-0.5f)*14;
    const int kind=layer==0?static_cast<int>(rng.bounded(4)):static_cast<int>(rng.bounded(5))%2;
    const float scale=0.8f+random()*0.6f,yaw=random()*6.2831853f;
    // Canopies (up to ~11 m radius at full scale) must not overhang the lane.
    if(index.nearest(x,z).distance<(kind<2?19.0f:9.0f)||shape.wet(x,z)) continue;
    emit(kind,x,z,scale,yaw);
  }
  // Woodland across the region from a forest-cover field. Each 250 m chunk has
  // its own stream so changing one area never reshuffles another.
  constexpr float spacing=21,chunk=250;
  for(float cz=std::floor(t_min_z/chunk)*chunk;cz<t_max_z;cz+=chunk) for(float cx=std::floor(t_min_x/chunk)*chunk;cx<t_max_x;cx+=chunk) {
    std::ostringstream domain;domain<<"scene-v2/forest/"<<static_cast<int>(cx/chunk)<<','<<static_cast<int>(cz/chunk);
    night::RandomStream local(seed,domain.str());
    auto r01=[&](){return static_cast<float>(local.bounded(100000))/100000.0f;};
    for(float gz=cz;gz<cz+chunk;gz+=spacing) for(float gx=cx;gx<cx+chunk;gx+=spacing) {
      const float x=gx+r01()*spacing,z=gz+r01()*spacing,keep=r01(),pick=r01(),scale=0.75f+r01()*0.65f,yaw=r01()*6.2831853f;
      if(x<t_min_x+60||x>t_max_x-60||z<t_min_z+60||z>t_max_z-60) continue;
      if(keep>shape.forest(x,z)*0.9f) continue;
      if(index.nearest(x,z).distance<60||shape.wet(x,z)) continue;
      // Conifers take over with altitude.
      const float h=shape.ground(x,z),conifer=0.35f+0.6f*smooth(10,90,h);
      emit(pick<conifer?1:(pick<conifer+0.05f?3:0),x,z,scale,yaw);
    }
  }
  out<<"]}";scene_json=out.str();return 0;
}
const char* nr_scene_ptr(){return scene_json.c_str();}
std::uint32_t nr_scene_size(){return static_cast<std::uint32_t>(scene_json.size());}
}
