import test from 'node:test';
import assert from 'node:assert/strict';
import {AU,PLANETS,CHECKPOINTS,FLIGHT,SUN_RADIUS,SYSTEM_RADIUS,YEAR_SECONDS,makeWaystations,orbitalPosition,orbitalVelocity,distance,planRoute,segmentSphereHit,segmentSphereEntry,burnFuel,fuelRange,canDock,canLand,leadPosition} from '../dist/simulation.js';

const positions=t=>CHECKPOINTS.map(c=>({...c,position:orbitalPosition(c,t)}));
const origin={x:0,y:0,z:0};

test('planet orbits retain real mean-distance ratios at a single linear scale',()=>{
  const expected=[.387,.723,1,1.524,5.203,9.582,19.201,30.047];
  PLANETS.forEach((p,i)=>{
    assert.equal(p.orbit/AU,expected[i]);
    assert.ok(Math.abs(distance(orbitalPosition(p,3482),origin)-p.orbit)<1e-8);
    assert.ok(p.orbit-p.radius>SUN_RADIUS+180);
    assert.ok(p.orbit+p.radius<SYSTEM_RADIUS);
  });
  assert.ok(PLANETS.at(-1).orbit/1240>70,'outer system must materially exceed the old scale');
  assert.ok(Math.abs(PLANETS[2].rate*YEAR_SECONDS-2*Math.PI)<1e-10);
  assert.ok(Math.abs(PLANETS[2].rate/PLANETS[7].rate-PLANETS[7].au**1.5)<1e-9);
});

test('depot network is deterministic, uniquely addressable, and inside the chart',()=>{
  assert.deepEqual(makeWaystations(),makeWaystations());
  assert.notDeepEqual(makeWaystations(),makeWaystations(1130));
  assert.equal(new Set(CHECKPOINTS.map(c=>c.id)).size,CHECKPOINTS.length);
  assert.ok(CHECKPOINTS.length>200);
  for(const c of CHECKPOINTS)assert.ok(c.orbit+c.bodyRadius+150<SYSTEM_RADIUS);
  for(const id of ['ceres','vesta','pallas','hygiea','mars-anchorage','neptune-anchorage'])assert.ok(CHECKPOINTS.some(c=>c.id===id));
});

test('fuel depots remain a connected, reserve-safe network as their rings rotate',()=>{
  for(const t of [0,1500,7200,43200,172800]){
    const nodes=positions(t),seen=new Set([0]),queue=[0],range=FLIGHT.fuelRange*(1-FLIGHT.routeReserve);
    for(let k=0;k<queue.length;k++)for(let j=0;j<nodes.length;j++){
      if(seen.has(j))continue;
      const a=nodes[queue[k]].position,b=nodes[j].position;
      if(distance(a,b)<=range&&!segmentSphereHit(a,b,origin,SUN_RADIUS+180)){seen.add(j);queue.push(j);}
    }
    assert.equal(seen.size,nodes.length,`network disconnected at ${t}s`);
    for(const p of PLANETS)assert.ok(nodes.some(c=>distance(c.position,orbitalPosition(p,t))<AU),'every planet needs local fuel access');
  }
});

test('routes cross the entire system with reachable fuel legs and solar clearance',()=>{
  for(const t of [0,1500,7200])for(const p of PLANETS){
    const start=orbitalPosition(PLANETS.find(p=>p.id==='mars'),t),end=orbitalPosition(p,t);
    const route=planRoute(start,end,positions(t),100);assert.ok(route,`missing Mars -> ${p.id} route at ${t}`);
    const points=[start,...route.stops.map(c=>c.position),end];
    for(let i=1;i<points.length;i++){
      assert.ok(distance(points[i-1],points[i])<=fuelRange(i===1?97:85)+1e-6);
      assert.equal(segmentSphereHit(points[i-1],points[i],origin,SUN_RADIUS+180),false);
    }
    if(p.id==='neptune')assert.ok(route.stops.length>=3,'outer crossing should require refuelling');
  }
  const route=planRoute(orbitalPosition(PLANETS[7],0),orbitalPosition(PLANETS[0],0),positions(0),100);
  assert.ok(route?.stops.length>=3);
});

test('routing respects actual remaining fuel and avoids a shortcut through the Sun',()=>{
  assert.equal(planRoute({x:AU,y:0,z:0},{x:10*AU,y:0,z:0},[],5),null);
  assert.equal(planRoute({x:AU,y:0,z:0},{x:-AU,y:0,z:0},[],100),null);
  assert.ok(planRoute({x:AU,y:0,z:0},{x:AU+100,y:0,z:0},[],5));
});

test('fuel consumption is distance-based, frame-independent, and finite',()=>{
  assert.equal(burnFuel(100,AU*4),50);
  let tank=100;for(let i=0;i<240;i++)tank=burnFuel(tank,AU*4/240);
  assert.ok(Math.abs(tank-50)<1e-10);
  assert.ok(burnFuel(100,AU,true)<burnFuel(100,AU,false));
  assert.equal(burnFuel(1,AU*100),0);assert.equal(burnFuel(50,0),50);
});

test('moving-body velocities and long-distance interception are consistent',()=>{
  for(const body of [...PLANETS,CHECKPOINTS[30]]){
    const t=1234,dt=.001,a=orbitalPosition(body,t),b=orbitalPosition(body,t+dt),v=orbitalVelocity(body,t);
    assert.ok(Math.abs((b.x-a.x)/dt-v.x)<.001);
    assert.ok(Math.abs((b.z-a.z)/dt-v.z)<.001);
    const ship={x:200,y:60,z:300},lead=leadPosition(body,t,ship,FLIGHT.cruiseSpeed);
    const travel=distance(lead,ship)/FLIGHT.cruiseSpeed,expected=orbitalPosition(body,t+travel);
    assert.ok(distance(lead,expected)<.01);
  }
});

test('cruise collision sweeps catch bodies between frames; docking requires slowing',()=>{
  assert.ok(segmentSphereEntry({x:-500,y:0,z:0},{x:500,y:0,z:0},34)!==null);
  assert.equal(segmentSphereEntry({x:-500,y:40,z:0},{x:500,y:40,z:0},34),null);
  assert.equal(canDock(100,100),false);assert.equal(canDock(130,10),false);assert.equal(canDock(100,10),true);
  assert.equal(canLand(45,20),true);assert.equal(canLand(45,100),false);assert.equal(canLand(90,5),false);
});

test('a nearly reached fuel stop remains available while approaching on a low tank',()=>{
  const start={x:AU*10,y:0,z:0},depot={id:'nearby',position:{x:AU*10+100,y:0,z:0}},end={x:AU*15,y:0,z:0};
  const route=planRoute(start,end,[depot],10);
  assert.ok(route);assert.equal(route.stops[0].id,'nearby');
  assert.equal(planRoute(start,end,[depot],100).stops.length,0,'a full tank should not revisit the same depot');
});
