// Shared world policy and pure helpers. Units are gameplay units, not kilometres.
export const AU = 3000;
export const SYSTEM_RADIUS = 38 * AU;
export const SUN_RADIUS = 210;
export const YEAR_SECONDS = 1500;
export const FLIGHT = Object.freeze({
  normalSpeed: 160, boostSpeed: 340, cruiseSpeed: 1200,
  fuelRange: 8 * AU, routeReserve: 0.15, drySpeed: 18,
  dockRange: 120, dockSpeed: 35, refuelPerSecond: 25,
  cruiseClearance: 650, approachDistance: 1400,
});
export const orbitalRate = au => Math.PI * 2 / (YEAR_SECONDS * au ** 1.5);

// Mean Sun-distance ratios: NASA, Interesting Fact of the Month (2019).
// Circular, coplanar orbits; planet sizes and passage of time remain exaggerated.
export const PLANETS = [
  { id:'mercury', name:'Mercury', type:'CRATERED WORLD', au:0.387, radius:34, phase:2.4, color:'#bda995', kind:0, desc:'A small, scarred world in the glare of the Sun. The inner orbit moves fast—lead your approach.' },
  { id:'venus', name:'Venus', type:'CLOUD WORLD', au:0.723, radius:56, phase:4.9, color:'#edbe79', kind:1, desc:'An amber world beneath a thick veil of clouds. Touch down on a floating atmospheric platform.' },
  { id:'earth', name:'Earth', type:'OCEAN WORLD', au:1, radius:60, phase:0.6, color:'#69c7ef', kind:2, desc:'Blue oceans, green continents, and a familiar place to catch your breath. A port in the inner system.' },
  { id:'mars', name:'Mars', type:'DESERT WORLD', au:1.524, radius:44, phase:1.8, color:'#f18963', kind:3, desc:'Your departure world. Rusted valleys beneath a thin atmosphere. A quiet frontier, waiting for its first story.' },
  { id:'jupiter', name:'Jupiter', type:'GAS GIANT', au:5.203, radius:180, phase:3.8, color:'#deb69b', kind:4, desc:'Immense storms flow across bands of cloud. Dock at an atmospheric station above the gas giant.' },
  { id:'saturn', name:'Saturn', type:'RINGED GIANT', au:9.582, radius:150, phase:5.45, color:'#ead59b', kind:4, rings:true, desc:'A golden giant encircled by ice. Your landing platform floats above its cloud tops.' },
  { id:'uranus', name:'Uranus', type:'ICE GIANT', au:19.201, radius:108, phase:2.75, color:'#88e0dc', kind:5, rings:true, desc:'A pale cyan world tilted into the dark. Dock above the atmosphere at the outer-system station.' },
  { id:'neptune', name:'Neptune', type:'ICE GIANT', au:30.047, radius:104, phase:4.8, color:'#638fff', kind:5, desc:'Deep blue winds at the edge of the chart. A remote platform marks the farthest port from home.' },
].map(p => ({ ...p, orbit:p.au * AU, rate:orbitalRate(p.au) }));

function seededRandom(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

export function makeWaystations(seed = 1129) {
  const random = seededRandom(seed), stations = [];
  // Fictional supply sites, not an astronomical minor-body catalogue. Outer
  // depots are icy waystations; water/propellant can also be imported.
  const bands = [0.55, 1.4, 2.6, 4.4, 6.6, 9, 12, 15.5, 19.5, 23.5, 27.5, 31.5, 35];
  for (const [band, au] of bands.entries()) {
    const count = Math.max(4, Math.ceil(2 * Math.PI * au / 4.8));
    const offset = random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const code = `${String(band + 1).padStart(2,'0')}-${String(i + 1).padStart(2,'0')}`;
      stations.push({ id:`depot-${code}`, name:`${au < 4 ? 'Belt' : au < 12 ? 'Frontier' : 'Drift'} ${code}`,
        au, phase:offset + i * Math.PI * 2 / count, verticalOffset:(random() - .5) * 70,
        type:au > 5 ? 'ICY FUEL WAYSTATION' : 'ASTEROID FUEL DEPOT', bodyRadius:28 + random() * 15,
      });
    }
  }
  // Named locations have approximate mean orbital radii, fictional phases and facilities.
  stations.push(
    { id:'ceres', name:'Ceres Anchorage', au:2.77, phase:1.95, type:'DWARF-PLANET ICE REFINERY', bodyRadius:65 },
    { id:'vesta', name:'Vesta Shipyard', au:2.36, phase:3.1, type:'ASTEROID / IMPORTED PROPELLANT', bodyRadius:48 },
    { id:'pallas', name:'Pallas Rest', au:2.77, phase:5.3, type:'ASTEROID FUEL DEPOT', bodyRadius:46 },
    { id:'hygiea', name:'Hygiea Exchange', au:3.14, phase:0.2, type:'ASTEROID FUEL DEPOT', bodyRadius:50 },
  );
  for (const p of PLANETS) stations.push({
    id:`${p.id}-anchorage`, name:`${p.name} Anchorage`, au:p.au,
    phase:p.phase + (p.radius + 500) / p.orbit,
    type:'LOCAL ASTEROID SUPPLY DEPOT', bodyRadius:32,
  });
  return stations.map(s => ({ ...s, verticalOffset:s.verticalOffset ?? 0,
    orbit:s.au * AU, rate:orbitalRate(s.au), radius:24,
  }));
}
export const CHECKPOINTS = makeWaystations();

export function orbitalPosition(p,t) {
  const a = p.phase + p.rate * t;
  return { x:Math.cos(a)*p.orbit, y:p.verticalOffset ?? 0, z:Math.sin(a)*p.orbit };
}
export function orbitalVelocity(p,t) {
  const a = p.phase + p.rate * t;
  return { x:-Math.sin(a)*p.orbit*p.rate, y:0, z:Math.cos(a)*p.orbit*p.rate };
}
export function orbitalNormal(p,t) {
  const a = p.phase + p.rate * t;
  return { x:Math.cos(a), y:0, z:Math.sin(a) };
}
export const distance = (a,b) => Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z);
export const fuelRange = fuel => Math.max(0, fuel) / 100 * FLIGHT.fuelRange;
export function burnFuel(fuel, travelled, boost = false) {
  return Math.max(0, fuel - Math.max(0,travelled) / FLIGHT.fuelRange * 100 * (boost ? 1.35 : 1));
}
export function canDock(surfaceDistance,relativeSpeed) {
  return surfaceDistance <= FLIGHT.dockRange && relativeSpeed <= FLIGHT.dockSpeed;
}
export function canLand(surfaceDistance,relativeSpeed) {
  return surfaceDistance <= 55 && surfaceDistance >= -2 && relativeSpeed <= 28;
}
export function interceptTime(relative,velocity,speed) {
  const a=velocity.x**2+velocity.y**2+velocity.z**2-speed**2;
  const b=2*(relative.x*velocity.x+relative.y*velocity.y+relative.z*velocity.z);
  const c=relative.x**2+relative.y**2+relative.z**2;
  if(Math.abs(a)<1e-8)return b<0?-c/b:0;
  const d=b*b-4*a*c;if(d<0)return 0;
  const roots=[(-b-Math.sqrt(d))/(2*a),(-b+Math.sqrt(d))/(2*a)].filter(t=>t>0);
  return roots.length?Math.min(...roots):0;
}
export function leadPosition(p,t,ship,speed) {
  const now=orbitalPosition(p,t),rel={x:now.x-ship.x,y:now.y-ship.y,z:now.z-ship.z};
  let dt=interceptTime(rel,orbitalVelocity(p,t),Math.max(speed,25));
  for(let i=0;i<8;i++)dt=distance(orbitalPosition(p,t+dt),ship)/Math.max(speed,25);
  return orbitalPosition(p,t+dt);
}

// A segment test is required at cruise speed: endpoint tests miss small bodies.
export function segmentSphereEntry(a,b,radius) {
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,A=dx*dx+dy*dy+dz*dz;
  const C=a.x*a.x+a.y*a.y+a.z*a.z-radius*radius;
  if(C<=0)return 0;if(A<1e-12)return null;
  const B=2*(a.x*dx+a.y*dy+a.z*dz),D=B*B-4*A*C;if(D<0)return null;
  const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;
}
export function segmentSphereHit(a,b,center,radius) {
  const x=b.x-a.x,y=b.y-a.y,z=b.z-a.z,den=x*x+y*y+z*z;
  const t=den?Math.max(0,Math.min(1,((center.x-a.x)*x+(center.y-a.y)*y+(center.z-a.z)*z)/den)):0;
  return Math.hypot(a.x+x*t-center.x,a.y+y*t-center.y,a.z+z*t-center.z)<=radius;
}

// Dijkstra over current orbital positions. Reserve 15% of a full tank on later
// legs; the first leg uses the actual remaining fuel. Replan as bodies move.
export function planRoute(start,end,stations,fuel=100) {
  const points=[start,...stations.map(s=>s.position),end],last=points.length-1;
  const cost=new Float64Array(points.length).fill(Infinity),done=new Set(),previous=new Int32Array(points.length).fill(-1);
  cost[0]=0;
  while(true) {
    let u=-1,best=Infinity;
    for(let i=0;i<points.length;i++)if(!done.has(i)&&cost[i]<best){best=cost[i];u=i;}
    if(u<0)return null;
    if(u===last)break;
    done.add(u);
    const range=u===0?fuelRange(Math.max(0,fuel-3)):FLIGHT.fuelRange*(1-FLIGHT.routeReserve);
    for(let v=1;v<points.length;v++) {
      if(done.has(v)||v===u)continue;
      const length=distance(points[u],points[v]);
      if(length>range||segmentSphereHit(points[u],points[v],{x:0,y:0,z:0},SUN_RADIUS+180))continue;
      const next=best+length+(v===last?0:600); // Fuel-stop overhead discourages needless detours.
      if(next<cost[v]){cost[v]=next;previous[v]=u;}
    }
  }
  const indices=[];
  for(let i=last;previous[i]>0;i=previous[i])indices.unshift(previous[i]);
  const stops=indices.map(i=>stations[i-1]);
  const legs=[start,...stops.map(s=>s.position),end];
  return {stops,distance:legs.slice(1).reduce((n,p,i)=>n+distance(legs[i],p),0)};
}
