import test from 'node:test';
import {CatmullRomCurve3,Vector3} from '../dist/vendor/three.module.js';
import assert from 'node:assert/strict';
import {ROVER_SPAWN,ROVER,SITES,ROADS,MARS_ROCKS,distanceToRoad,SITE_BY_ID,MARS_LIMIT,SOLAR,terrainHeight,solarPositions,collides,stepRover,canInteract,interactMars,missionForStage,decodeMarsSave} from '../dist/mars-world.js';

function drive(state,input,seconds,hz=60){let s={...state};for(let i=0;i<Math.round(seconds*hz);i++)s=stepRover(s,input,1/hz);return s;}

test('Mars sites and spawns are usable and terrain is finite across the playable region',()=>{
  assert.equal(new Set(SITES.map(s=>s.id)).size,SITES.length);
  assert.equal(collides(ROVER_SPAWN.x,ROVER_SPAWN.z),false);
  for(const site of SITES){assert.equal(collides(site.x,site.z),false,site.id);assert.ok(Number.isFinite(terrainHeight(site.x,site.z)));}
  for(let x=-900;x<=900;x+=75)for(let z=-900;z<=900;z+=75)assert.ok(Number.isFinite(terrainHeight(x,z)));
  assert.equal(solarPositions().length,SOLAR.columns*SOLAR.rows);
});

test('rover acceleration, braking and reverse are stable at 30 and 60 Hz',()=>{
  const start={x:-400,z:100,heading:0,speed:0};
  const a=drive(start,{throttle:1},5,60),b=drive(start,{throttle:1},5,30);
  assert.ok(Math.abs(a.z-b.z)<.02);assert.ok(a.speed<=ROVER.maxSpeed);assert.ok(a.z<start.z);
  const parked=drive(a,{brake:true},2);assert.equal(parked.speed,0);
  const reversed=drive(parked,{throttle:-1},3);assert.ok(reversed.speed<0);assert.ok(reversed.z>parked.z);
});

test('rover steers while moving and cannot pivot at a standstill',()=>{
  const still=drive(ROVER_SPAWN,{steer:1},1);assert.equal(still.heading,ROVER_SPAWN.heading);
  const turning=drive(ROVER_SPAWN,{throttle:1,steer:1},1);assert.ok(turning.heading>still.heading);
});

test('facility and solar-array collision bounds block the chassis',()=>{
  assert.equal(collides(-88,22),true);assert.equal(collides(SOLAR.x,SOLAR.z),true);
  const stopped=drive({x:-88,z:57,heading:0,speed:0},{throttle:1},8);
  assert.ok(stopped.z>=40+ROVER.radius-.05);assert.equal(collides(stopped.x,stopped.z),false);
});

test('the first rover trip reaches the workshop safely using ordinary controls',()=>{
  let rover=drive(ROVER_SPAWN,{throttle:1},5.5);rover=drive(rover,{brake:true},1.2);
  assert.ok(canInteract(rover,SITE_BY_ID.get('workshop')),JSON.stringify(rover));
  const collected=interactMars(0,rover,'workshop');assert.equal(collected.stage,1);
});

test('the controller activity has ordered physical interactions and idempotent outcomes',()=>{
  const at=id=>({...SITE_BY_ID.get(id),heading:0,speed:0});
  assert.equal(interactMars(0,at('solar'),'solar').stage,0,'delivery needs the controller');
  assert.equal(interactMars(0,ROVER_SPAWN,'workshop').ok,false,'remote interactions cannot grant cargo');
  let result=interactMars(0,at('workshop'),'workshop');assert.equal(result.stage,1);
  assert.equal(interactMars(1,at('workshop'),'workshop').stage,1);
  result=interactMars(result.stage,at('solar'),'solar');assert.equal(result.stage,2);
  assert.equal(interactMars(2,at('solar'),'solar').stage,2);
  result=interactMars(result.stage,at('expansion'),'expansion');assert.equal(result.stage,3);
  assert.equal(missionForStage(result.stage).target,'lander');
  assert.equal(interactMars(3,at('lander'),'lander').depart,true);
});

test('interaction requires parking and cannot progress while driving past',()=>{
  const p=SITE_BY_ID.get('workshop');
  assert.equal(canInteract({...p,speed:10},p),false);
  assert.equal(interactMars(0,{...p,speed:10},'workshop').stage,0);
});

test('surface saves preserve progress, restore a parked rover, and reject broken positions',()=>{
  const original={version:1,stage:1,rover:{...ROVER_SPAWN,x:-90,z:55,speed:12},target:'solar'};
  const loaded=decodeMarsSave(JSON.stringify(original));assert.equal(loaded.stage,1);assert.equal(loaded.rover.speed,0);assert.equal(loaded.target,'solar');assert.equal(loaded.rover.x,-90);
  const damaged=decodeMarsSave(JSON.stringify({...original,rover:{x:NaN,z:0,heading:0}}));assert.deepEqual(damaged.rover,ROVER_SPAWN);assert.equal(damaged.stage,1);
  const inside=decodeMarsSave(JSON.stringify({...original,rover:{x:-88,z:22,heading:0}}));assert.deepEqual(inside.rover,ROVER_SPAWN);
  const far=decodeMarsSave(JSON.stringify({...original,rover:{x:MARS_LIMIT+1,z:0,heading:0}}));assert.deepEqual(far.rover,ROVER_SPAWN);
  for(const bad of ['{broken','null',JSON.stringify({...original,version:77}),JSON.stringify({...original,stage:5})])assert.equal(decodeMarsSave(bad).stage,0);
});


test('the rendered service-road centre lines clear all facility and stock collision bounds',()=>{
  for(const [index,road] of ROADS.entries()){
    const curve=new CatmullRomCurve3(road.map(([x,z])=>new Vector3(x,0,z)));
    for(let i=0;i<=500;i++){const p=curve.getPoint(i/500);assert.equal(collides(p.x,p.z),false,`road ${index} blocked near ${p.x},${p.z}`);}
  }
  for(const rock of MARS_ROCKS)assert.ok(distanceToRoad(rock.x,rock.z)>=18+rock.size,'rocks must not spawn in service roads');
});

test('expanded districts are connected to the original campus and have accessible stops',async()=>{
  const {DISTRICTS,CREW,crewPosition}=await import('../dist/mars-world.js');
  assert.equal(SITES.length,16);assert.equal(DISTRICTS.length,10);assert.equal(CREW.length,12);
  for(const site of SITES){assert.ok(Math.hypot(site.x,site.z)<MARS_LIMIT);assert.ok(distanceToRoad(site.x,site.z)<35,site.id+' needs a road approach');}
  const curves=ROADS.map(road=>new CatmullRomCurve3(road.map(([x,z])=>new Vector3(x,0,z))));
  const samples=curves.map(c=>Array.from({length:201},(_,i)=>c.getPoint(i/200)));
  const connected=new Set([0]);let changed=true;
  while(changed){changed=false;for(let i=0;i<samples.length;i++)if(!connected.has(i)){
    if([...connected].some(j=>samples[i].some(a=>samples[j].some(b=>a.distanceTo(b)<15)))){connected.add(i);changed=true;}
  }}
  assert.equal(connected.size,ROADS.length,'every service road joins the usable road network');
  for(const person of CREW)for(let time=0;time<40;time+=.5){const p=crewPosition(person,time);assert.equal(collides(p.x,p.z,.5),false,person.id+' EVA path clips a facility');}
});

test('older field logs gain empty discovery lists; new logs sanitize unknown and duplicate stops',()=>{
  const old=decodeMarsSave(JSON.stringify({version:1,stage:2,rover:ROVER_SPAWN}));assert.deepEqual(old.visited,[]);assert.equal(old.stage,2);
  const latest=decodeMarsSave(JSON.stringify({version:1,stage:2,rover:ROVER_SPAWN,visited:['water','workshop','water','unknown',null]}));
  assert.deepEqual(latest.visited,['water','workshop']);assert.equal(latest.stage,2);
});
