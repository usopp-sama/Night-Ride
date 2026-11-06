import {makeWorld,THREE} from './scene.js';
import {AU,FLIGHT,SYSTEM_RADIUS,SUN_RADIUS,orbitalVelocity,leadPosition,segmentSphereEntry,canLand,canDock,burnFuel,fuelRange,planRoute} from './simulation.js';
import {makeNavigation} from './navigation.js';
const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp;
let world;
try{world=makeWorld($('space'));}catch(error){$('error').hidden=false;throw error;}
const {camera,renderer,scene,ship,model,planets,rocks,checkpoints,pad}=world;
const planetById=new Map(planets.map(p=>[p.id,p])),depotById=new Map(checkpoints.map(c=>[c.id,c]));
const clock=new THREE.Clock(),velocity=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(0,0,-1),origin=new THREE.Vector3(),keys=new Set(),stick={x:0,y:0};
let state='menu',simTime=0,visualTime=0,yaw=0,pitch=0,throttle=.35,energy=100,fuel=100,health=100;
let invulnerable=0,toastTime=0,alignTime=0,boostHeld=false,brakeHeld=false,boosting=false,cruise=false,approachBrake=0;
let selected={type:'planet',id:'mars'},route=null,routeTimer=0,landing=null,service=null,transitionTime=0,pausedFrom='flight',mapReturnFocus=null;
let lowFuelWarned=false,uiAccumulator=0,accumulator=0,muted=true,audioCtx,engineGain,engineOsc;
const visited=new Set(),checkpointHits=new Set();
let checkpoint={type:'planet',id:'mars',normal:new THREE.Vector3(0,.13,1).normalize(),altitude:125,name:'Mars departure orbit'};
const cpMarkers=Array.from({length:4},()=>{const el=document.createElement('div');el.className='checkpoint-marker';el.hidden=true;$('flight-ui').appendChild(el);return el;});
for(const p of planets){const dot=document.createElement('i');dot.title=p.name;$('world-dots').appendChild(dot);}
function currentTarget(){return selected.type==='planet'?planetById.get(selected.id):depotById.get(selected.id);}
function navigationTarget(){return route?.stops.length?depotById.get(route.stops[0].id):currentTarget();}
function bodyPosition(t){return t.center||t.root.position;}
function targetPosition(){return bodyPosition(navigationTarget());}
function targetLead(){return new THREE.Vector3().copy(leadPosition(navigationTarget(),simTime,ship.position,Math.max(velocity.length(),cruise?FLIGHT.cruiseSpeed:throttle*FLIGHT.normalSpeed,40)));}
function refreshRoute(){
  const end=new THREE.Vector3().copy(leadPosition(currentTarget(),simTime,ship.position,FLIGHT.cruiseSpeed));
  const candidates=checkpoints.filter(c=>c.id!==selected.id).map(c=>({...c,position:c.center}));
  route=planRoute(ship.position,end,candidates,fuel);routeTimer=0;
}
function selectTarget(type,id){
  if(type==='planet'&&!planetById.has(id)||type==='checkpoint'&&!depotById.has(id))throw new Error('Unknown destination');
  selected={type,id};refreshRoute();navigation.refreshList(visited,checkpointHits);updateHud();
  if(state!=='menu')notify(`${currentTarget().name} plotted · ${route?.stops.length?route.stops.length+' fuel stops':'R to align'}`);
}
const navigation=makeNavigation({planets,stations:checkpoints,ship,getFuel:()=>fuel,getRoute:()=>route,getSelected:()=>selected,getLeg:navigationTarget,onSelect:(type,id)=>{selectTarget(type,id);navigation.draw();}});
function directionToAngles(d){yaw=Math.atan2(-d.x,-d.z);pitch=Math.asin(clamp(d.y,-1,1));}
function orient(direction){directionToAngles(direction.clone().normalize());ship.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));}
function notify(text){$('toast').textContent=text;$('toast').classList.add('show');toastTime=4.5;}
function clearInput(){keys.clear();stick.x=stick.y=0;boostHeld=brakeHeld=false;$('stick').style.transform='';}
function audioStart(){
  if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();engineOsc=audioCtx.createOscillator();engineGain=audioCtx.createGain();const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;engineOsc.type='sawtooth';engineOsc.frequency.value=45;engineGain.gain.value=0;engineOsc.connect(filter);filter.connect(engineGain);engineGain.connect(audioCtx.destination);engineOsc.start();}
  audioCtx.resume();
}
function tone(freq,len,type='sine'){
  if(muted||!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.7,audioCtx.currentTime+len);g.gain.setValueAtTime(.1,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+len);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+len);
}
function start(){
  state='flight';orient(ship.position.clone().sub(planetById.get('mars').root.position));clearInput();$('menu').hidden=true;$('flight-ui').hidden=false;$('pause').hidden=false;$('cruise').hidden=false;$('landing-panel').hidden=true;document.body.classList.add('flying');$('touch').hidden=!matchMedia('(pointer:coarse)').matches;world.resetTrail();refreshRoute();updateHud();notify('Depart Mars · M plots your route · N finds fuel · C engages cruise');if(!muted)try{audioStart();}catch{}
}
function nearestPlanet(){
  let result=null;
  for(const p of planets){const altitude=ship.position.distanceTo(p.root.position)-p.radius;if(!result||altitude<result.altitude){const pv=new THREE.Vector3().copy(orbitalVelocity(p,simTime));result={planet:p,altitude,relativeSpeed:velocity.clone().sub(pv).length(),velocity:pv};}}
  return result;
}
function nearestDepot(){
  let station=null,range=Infinity;
  for(const c of checkpoints){const d=ship.position.distanceToSquared(c.center);if(d<range){station=c;range=d;}}
  const v=new THREE.Vector3().copy(orbitalVelocity(station,simTime));
  return {station,range:Math.sqrt(range),velocity:v,relativeSpeed:velocity.clone().sub(v).length()};
}
function nearestFuel(){if(state==='menu')return;const n=nearestDepot();selectTarget('checkpoint',n.station.id);notify(`${n.station.name} tracked · ${formatRange(n.range)} away · R to align`);}
function toggleCruise(){
  if(state!=='flight'||$('map-dialog').open)return;
  if(cruise){cruise=false;approachBrake=1.8;notify('Cruise disengaged · slowing to manoeuvring speed');return;}
  if(fuel<5){notify('Not enough fuel for cruise · N finds the nearest depot');return;}
  if(nearestPlanet().altitude<FLIGHT.cruiseClearance||nearestDepot().range<300||ship.position.length()<SUN_RADIUS+650){notify('Cruise locked near a body · clear 650 u from the planet and 300 u from depots');return;}
  if(ship.position.distanceTo(targetPosition())<FLIGHT.approachDistance){notify('Destination in approach range · use throttle and boost');return;}
  cruise=true;alignTime=2;notify('Cruise engaged · R aligns your course · Shift brakes');
}
function pause(){
  if($('map-dialog').open){closeMap();return;}
  if(state==='paused'){state=pausedFrom;$('pause-dialog').close();clearInput();return;}
  if(!['flight','landed','refueling','docked'].includes(state))return;
  pausedFrom=state;state='paused';clearInput();$('pause-title').innerHTML='A moment<br>among the stars.';$('pause-text').textContent='Need assistance? Rescue returns you to your last port with a full tank.';$('resume').innerHTML='Resume expedition <span>↗</span>';$('respawn').hidden=false;$('pause-dialog').showModal();
}
function openMap(){
  if(['landing','takeoff','disabled'].includes(state))return;
  if($('map-dialog').open){closeMap();return;}
  if(state==='paused')pause();clearInput();mapReturnFocus=document.activeElement;refreshRoute();$('map-flight-status').textContent=state==='menu'?'EXPEDITION PLANNER':'FLIGHT PAUSED';$('map-dialog').showModal();navigation.refreshList(visited,checkpointHits);navigation.draw();
}
function closeMap(){if(!$('map-dialog').open)return;$('map-dialog').close();clearInput();mapReturnFocus?.focus?.();mapReturnFocus=null;}
function alignCourse(){if(state!=='flight')return;alignTime=2;notify('Aligning with '+navigationTarget().name+' · steer to take control');}
function damage(amount,message){
  if(invulnerable>0||state!=='flight')return;health=Math.max(0,health-amount);invulnerable=2.5;cruise=false;approachBrake=1;tone(85,.25,'sawtooth');$('flash').style.opacity='.3';setTimeout(()=>$('flash').style.opacity='0',160);notify(message);
  if(health<=0){state='disabled';clearInput();$('pause-title').textContent='Signal lost.';$('pause-text').textContent=`Your rescue beacon is linked to ${checkpoint.name}. Exploration progress is safe.`;$('resume').innerHTML='Return to checkpoint <span>↗</span>';$('respawn').hidden=true;$('pause-dialog').showModal();}
}
function respawn(){
  if($('pause-dialog').open)$('pause-dialog').close();if($('map-dialog').open)$('map-dialog').close();
  if(checkpoint.type==='planet'){const p=planetById.get(checkpoint.id);ship.position.copy(p.root.position).addScaledVector(checkpoint.normal,p.radius+checkpoint.altitude);orient(checkpoint.normal);velocity.copy(orbitalVelocity(p,simTime));}
  else{const c=depotById.get(checkpoint.id);ship.position.copy(c.center).addScaledVector(c.normal,150);orient(c.normal);velocity.copy(orbitalVelocity(c,simTime));}
  health=energy=fuel=100;throttle=.35;state='flight';invulnerable=5;landing=service=null;pad.visible=false;alignTime=0;cruise=false;approachBrake=0;lowFuelWarned=false;clearInput();$('landing-panel').hidden=true;$('flight-ui').hidden=false;$('touch').hidden=!matchMedia('(pointer:coarse)').matches;document.body.classList.add('flying');world.resetTrail();refreshRoute();updateHud();notify('Recovered at '+checkpoint.name+' · full fuel and hull');
}
function interact(){
  if(state==='landed'){takeoff();return;}
  if(state==='refueling'||state==='docked'){departDepot();return;}
  if(state!=='flight')return;
  const d=nearestDepot(),p=nearestPlanet();
  if(d.range<FLIGHT.dockRange+60&&d.range<p.altitude+60){
    if(!canDock(d.range,d.relativeSpeed)){notify(d.range>FLIGHT.dockRange?'Close to within 120 u of the depot.':'Hold Shift to match the depot’s speed.');return;}
    dockDepot(d.station);return;
  }
  land();
}
function dockDepot(c){
  state='refueling';service={station:c};cruise=false;approachBrake=0;alignTime=0;velocity.set(0,0,0);clearInput();
  checkpoint={type:'checkpoint',id:c.id,name:c.name};checkpointHits.add(c.id);c.active=true;c.ring.material.color.set(0x7cddff);
  $('flight-ui').hidden=true;$('touch').hidden=true;$('landing-panel').hidden=false;$('landed-type').textContent=c.type;$('landed-name').textContent=c.name;$('landed-description').textContent='Dock secured. Propellant transfer and hull repairs are underway. Depart whenever you are ready.';$('takeoff').innerHTML='Depart depot <span>↗</span>';$('takeoff').focus();document.body.classList.remove('flying');tone(740,.2);world.resetTrail();updateService(0);updateHud();
}
function updateService(dt){
  const c=service.station;fuel=clamp(fuel+FLIGHT.refuelPerSecond*dt,0,100);health=clamp(health+30*dt,0,100);energy=clamp(energy+30*dt,0,100);
  ship.position.copy(c.center).addScaledVector(c.normal,42);orient(c.normal);lowFuelWarned=false;
  $('landed-status').textContent=`FUEL ${Math.round(fuel)}% · HULL ${Math.round(health)}% · ${fuel===100?'TRANSFER COMPLETE':'REFUELLING'}`;
  if(fuel===100&&health===100&&energy===100)state='docked';
}
function departDepot(){
  const c=service.station;ship.position.copy(c.center).addScaledVector(c.normal,150);orient(c.normal);velocity.copy(orbitalVelocity(c,simTime)).addScaledVector(c.normal,12);service=null;state='flight';throttle=.25;invulnerable=3;$('landing-panel').hidden=true;$('flight-ui').hidden=false;$('touch').hidden=!matchMedia('(pointer:coarse)').matches;document.body.classList.add('flying');clearInput();world.resetTrail();refreshRoute();navigation.refreshList(visited,checkpointHits);notify('Departure cleared · '+Math.round(fuel)+'% fuel');
}
function land(){
  const n=nearestPlanet();
  if(!canLand(n.altitude,n.relativeSpeed)){notify(n.altitude>55?'Get within 55 u of a planet, or press N to find a fuel depot.':'Hold Shift to match orbital speed before landing.');return;}
  landing={planet:n.planet,normal:ship.position.clone().sub(n.planet.root.position).normalize(),startOffset:ship.position.clone().sub(n.planet.root.position),startQuaternion:ship.quaternion.clone()};state='landing';transitionTime=0;velocity.set(0,0,0);cruise=false;approachBrake=0;clearInput();pad.visible=true;alignTime=0;$('interaction').hidden=true;$('touch').hidden=true;notify('Approach captured · landing on '+n.planet.name);
}
function finishLanding(){
  state='landed';health=energy=fuel=100;lowFuelWarned=false;visited.add(landing.planet.id);checkpoint={type:'planet',id:landing.planet.id,normal:landing.normal.clone(),altitude:125,name:landing.planet.name+' landing platform'};$('flight-ui').hidden=true;$('landing-panel').hidden=false;$('landed-type').textContent=landing.planet.type+' / LANDED';$('landed-name').textContent=landing.planet.name;$('landed-description').textContent=landing.planet.desc;$('landed-status').textContent='HULL REPAIRED · FUEL RESTORED';$('takeoff').innerHTML='Take off <span>↑</span>';$('takeoff').focus();document.body.classList.remove('flying');navigation.refreshList(visited,checkpointHits);tone(520,.35);notify(visited.size===8?'All eight worlds visited. The system is yours.':`${landing.planet.name} visited · ${visited.size} of 8 worlds`);
}
function takeoff(){
  state='takeoff';transitionTime=0;landing.startOffset=ship.position.clone().sub(landing.planet.root.position);landing.startQuaternion=ship.quaternion.clone();$('landing-panel').hidden=true;document.body.classList.add('flying');clearInput();notify('Liftoff · clear the planet before engaging cruise');
}
function landingQuaternion(){
  const n=landing.normal;let right=new THREE.Vector3(1,0,0).cross(n).normalize();if(right.lengthSq()<.1)right=new THREE.Vector3(0,0,1).cross(n).normalize();const z=new THREE.Vector3().crossVectors(right,n).normalize();return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,n,z));
}
function updateDock(dt){
  const p=landing.planet,n=landing.normal;pad.position.copy(p.root.position).addScaledVector(n,p.radius+1);pad.quaternion.setFromUnitVectors(up,n);
  if(state==='landed'){ship.position.copy(p.root.position).addScaledVector(n,p.radius+2.8);ship.quaternion.copy(landingQuaternion());return;}
  transitionTime+=dt;const u=clamp(transitionTime/2.2,0,1),smooth=u*u*(3-2*u);
  if(state==='landing'){ship.position.copy(p.root.position).add(landing.startOffset.clone().lerp(n.clone().multiplyScalar(p.radius+2.8),smooth));ship.quaternion.slerpQuaternions(landing.startQuaternion,landingQuaternion(),smooth);if(u>=1)finishLanding();}
  else{
    ship.position.copy(p.root.position).add(landing.startOffset.clone().lerp(n.clone().multiplyScalar(p.radius+150),smooth));
    const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(origin,n,up));ship.quaternion.slerpQuaternions(landing.startQuaternion,q,smooth);
    if(u>=1){state='flight';orient(n);velocity.copy(n).multiplyScalar(25).add(new THREE.Vector3().copy(orbitalVelocity(p,simTime)));throttle=.4;invulnerable=4;pad.visible=false;$('flight-ui').hidden=false;$('touch').hidden=!matchMedia('(pointer:coarse)').matches;world.resetTrail();landing=null;refreshRoute();notify('Free flight · M plots a route with fuel stops');}
  }
}
function simulate(dt){
  const previous=ship.position.clone();invulnerable=Math.max(0,invulnerable-dt);approachBrake=Math.max(0,approachBrake-dt);
  const steerX=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x;
  const steerY=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+stick.y;
  if(steerX||steerY)alignTime=0;
  if(alignTime>0){alignTime-=dt;const desired=targetLead().sub(ship.position).normalize();const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(origin,desired,up));ship.quaternion.slerp(q,1-Math.exp(-4*dt));directionToAngles(forward.clone().applyQuaternion(ship.quaternion));}
  else{const turn=cruise?.35:1;yaw-=steerX*1.2*turn*dt;pitch=clamp(pitch+steerY*.92*turn*dt,-1.45,1.45);const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));ship.quaternion.slerp(q,1-Math.exp(-7*dt));}
  model.userData.bank=-steerX*.45;throttle=clamp(throttle+((keys.has('KeyE')?1:0)-(keys.has('KeyQ')?1:0))*.45*dt,0,1);
  const near=nearestPlanet(),depot=nearestDepot();
  if(cruise&&(ship.position.distanceTo(targetPosition())<FLIGHT.approachDistance||near.altitude<900||depot.range<300||fuel<1)){
    cruise=false;approachBrake=2.2;notify('Approach speed · cruise disengaged · hold Shift to dock or land');
  }
  const braking=keys.has('ShiftLeft')||keys.has('ShiftRight')||brakeHeld||approachBrake>0;
  if(braking)cruise=false;
  boosting=!cruise&&!braking&&(keys.has('Space')||boostHeld)&&energy>1&&fuel>0;
  energy=clamp(energy+(boosting?-22:13)*dt,0,100);
  let wanted=braking?3:cruise?FLIGHT.cruiseSpeed:boosting?FLIGHT.boostSpeed:throttle*FLIGHT.normalSpeed;
  if(fuel<=0)wanted=Math.min(wanted,FLIGHT.drySpeed);
  const desiredVelocity=forward.clone().applyQuaternion(ship.quaternion).multiplyScalar(wanted);
  if(braking){if(depot.range<350&&depot.range<near.altitude)desiredVelocity.add(depot.velocity);else if(near.altitude<350)desiredVelocity.add(near.velocity);}
  velocity.lerp(desiredVelocity,1-Math.exp(-(braking?3.8:1.8)*dt));ship.position.addScaledVector(velocity,dt);
  fuel=burnFuel(fuel,ship.position.distanceTo(previous),boosting);
  if(fuel<20&&!lowFuelWarned){lowFuelWarned=true;notify('Low fuel · N finds the nearest depot · rescue is available in Pause');}
  // Collision tests use swept segments in moving bodies' reference frames.
  for(const p of planets){
    const a=previous.clone().sub(p.previous),b=ship.position.clone().sub(p.root.position),hit=segmentSphereEntry(a,b,p.radius+2);
    if(hit!==null){const normal=a.clone().lerp(b,hit).normalize();if(normal.lengthSq()<.1)normal.copy(up);ship.position.copy(p.root.position).addScaledVector(normal,p.radius+8);velocity.copy(normal).multiplyScalar(14).add(new THREE.Vector3().copy(orbitalVelocity(p,simTime)));throttle=.12;damage(30,'Surface impact · brake and match orbit before landing');break;}
  }
  for(const rock of rocks){
    if(ship.position.distanceToSquared(rock.center)>(velocity.length()*dt+rock.radius+8)**2)continue;
    const a=previous.clone().sub(rock.center),b=ship.position.clone().sub(rock.center),hit=segmentSphereEntry(a,b,rock.radius+2);
    if(hit!==null){const n=a.clone().lerp(b,hit).normalize();ship.position.copy(rock.center).addScaledVector(n,rock.radius+5);velocity.copy(n).multiplyScalar(20);damage(24,'Asteroid impact · hull damaged');break;}
  }
  for(const c of checkpoints){
    if(ship.position.distanceToSquared(c.bodyCenter)>(velocity.length()*dt+c.bodyRadius*1.25+8)**2)continue;
    const a=previous.clone().sub(c.previousBodyCenter),b=ship.position.clone().sub(c.bodyCenter),hit=segmentSphereEntry(a,b,c.bodyRadius*1.2+2);
    if(hit!==null){const n=a.clone().lerp(b,hit).normalize();ship.position.copy(c.bodyCenter).addScaledVector(n,c.bodyRadius*1.2+5);velocity.copy(n).multiplyScalar(20).add(new THREE.Vector3().copy(orbitalVelocity(c,simTime)));damage(24,'Refinery asteroid impact · use the open docking beacon');break;}
  }
  const solarHit=segmentSphereEntry(previous,ship.position,SUN_RADIUS+80);
  if(solarHit!==null){const n=previous.clone().lerp(ship.position,solarHit).normalize();ship.position.copy(n).multiplyScalar(SUN_RADIUS+100);velocity.copy(n).multiplyScalar(35);orient(n);damage(35,'Solar heat warning · turn away from the Sun');}
  if(ship.position.length()>SYSTEM_RADIUS){ship.position.clampLength(0,SYSTEM_RADIUS-50);orient(ship.position.clone().negate().normalize());velocity.multiplyScalar(.1);cruise=false;notify('Outer chart limit · turn back toward the supply network');}
}
function updateCamera(dt){
  let desired,look;
  if(state==='menu'){const q=ship.quaternion;desired=ship.position.clone().add(new THREE.Vector3(-10,5.5,17).applyQuaternion(q));look=ship.position.clone().add(new THREE.Vector3(-4,0,-4).applyQuaternion(q));}
  else if(service){const c=service.station;desired=ship.position.clone().add(new THREE.Vector3(16,9,24).applyQuaternion(c.root.quaternion));look=ship.position.clone().add(new THREE.Vector3(-8,0,0).applyQuaternion(c.root.quaternion));}
  else if(landing){const n=landing.normal;let side=new THREE.Vector3(1,0,0).cross(n).normalize();if(side.lengthSq()<.1)side.set(0,0,1);desired=ship.position.clone().addScaledVector(n,8).addScaledVector(side,17).add(new THREE.Vector3(0,4,0));look=ship.position.clone().addScaledVector(side,-4);}
  else{desired=ship.position.clone().add(new THREE.Vector3(0,4.5,innerWidth<650?21:17).applyQuaternion(ship.quaternion));look=ship.position.clone().add(forward.clone().applyQuaternion(ship.quaternion).multiplyScalar(35));}
  camera.position.lerp(desired,1-Math.exp(-5*dt));camera.lookAt(look);camera.fov=THREE.MathUtils.lerp(camera.fov,cruise?79:boosting?74:62,1-Math.exp(-3*dt));camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
function project(v){const p=v.clone().project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,z:p.z,behind:v.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3()))<0};}
function formatRange(d){return d>=AU*.1?`${(d/AU).toFixed(2)} AU`:`${Math.max(0,Math.round(d))} u`;}
function updateMarkers(){
  if(state!=='flight'){for(const id of ['target-marker','lead-marker','direction'])$(id).hidden=true;for(const el of cpMarkers)el.hidden=true;return;}
  const t=navigationTarget(),pos=bodyPosition(t),p=project(pos),inside=!p.behind&&p.x>70&&p.x<innerWidth-70&&p.y>90&&p.y<innerHeight-110;
  $('target-marker').hidden=!inside;$('direction').hidden=inside;
  if(inside){$('target-marker').style.left=p.x+'px';$('target-marker').style.top=p.y+'px';$('marker-name').textContent=t.name.toUpperCase();$('marker-distance').textContent=formatRange(ship.position.distanceTo(pos));}
  else{const local=pos.clone().sub(camera.position).applyQuaternion(camera.quaternion.clone().invert());let x=local.x,y=-local.y;const len=Math.hypot(x,y);if(len<.01){x=1;y=0;}else{x/=len;y/=len;}$('direction').style.left=clamp(innerWidth/2+x*innerWidth*.35,70,innerWidth-130)+'px';$('direction').style.top=clamp(innerHeight/2+y*innerHeight*.28,100,innerHeight-130)+'px';$('direction').innerHTML=`${x<-.3?'←':x>.3?'→':y<0?'↑':'↓'} <span>${t.name.toUpperCase()}</span>`;}
  const lead=project(targetLead());$('lead-marker').hidden=lead.behind||lead.x<40||lead.x>innerWidth-40||lead.y<90||lead.y>innerHeight-100;
  if(!$('lead-marker').hidden){$('lead-marker').style.left=lead.x+'px';$('lead-marker').style.top=lead.y+'px';}
  const nearby=checkpoints.filter(c=>c.id!==t.id).map(c=>({c,d:c.center.distanceTo(ship.position)})).filter(x=>x.d<4500).sort((a,b)=>a.d-b.d).slice(0,4);
  cpMarkers.forEach((el,i)=>{const item=nearby[i];if(!item){el.hidden=true;return;}const q=project(item.c.center);el.hidden=q.behind||q.x<40||q.x>innerWidth-40||q.y<90||q.y>innerHeight-100;if(!el.hidden){el.style.left=q.x+'px';el.style.top=q.y+'px';el.textContent=`◇ ${item.c.name} · ${formatRange(item.d)}`;}});
}
function updateHud(){
  const t=navigationTarget(),range=ship.position.distanceTo(bodyPosition(t))-(t.center?0:t.radius),rel=velocity.clone().sub(new THREE.Vector3().copy(orbitalVelocity(t,simTime))).length();
  $('target-name').textContent=t.name;$('destination-name').textContent='DESTINATION · '+currentTarget().name.toUpperCase();$('target-range').textContent=formatRange(range);$('relative-speed').textContent=Math.round(rel)+' u/s';
  $('route-summary').textContent=route?(route.stops.length?`${route.stops.length} fuel ${route.stops.length===1?'stop':'stops'} on route`:'Direct route within fuel range'):'No safe route on this tank · N for fuel';
  $('velocity').innerHTML=Math.round(['landed','menu','refueling','docked'].includes(state)?0:velocity.length()).toLocaleString()+' <small>U/S</small>';
  for(const [id,value] of [['health',health],['boost',energy],['fuel',fuel]]){$(id+'-value').textContent=Math.round(value)+'%';$(id+'-fill').style.width=value+'%';}
  $('fuel-fill').classList.toggle('low',fuel<20);$('fuel-range').textContent=(fuelRange(fuel)/AU).toFixed(1)+' AU';$('flight-mode').textContent=fuel<=0?'RESERVE THRUST':cruise?'CRUISE':approachBrake>0?'APPROACH':'MANOEUVRE';
  $('cruise').classList.toggle('engaged',cruise);$('cruise').setAttribute('aria-pressed',String(cruise));$('cruise-label').textContent=cruise?'Cruise on':'Cruise';$('cruise').disabled=state!=='flight';
  $('throttle-value').textContent=Math.round(throttle*100)+'%';$('visited-count').textContent=visited.size;$('checkpoint-note').textContent='Rescue port: '+checkpoint.name;
  [...$('world-dots').children].forEach((d,i)=>d.classList.toggle('visited',visited.has(planets[i].id)));
  $('objective').textContent=visited.size===8?'All worlds charted. Keep exploring.':'Depart Mars. Chart the system. Refuel at asteroid depots along the way.';
  $('nav-hint').textContent=t.center?'Slow within 120 u. Hold Shift to match speed, then F to dock.':range<500?'Hold Shift to match orbit. Land within 55 u with F.':'R to align · C for cruise after clearing nearby bodies.';
  const d=nearestDepot(),p=nearestPlanet(),showDepot=d.range<180&&d.range<p.altitude+60,showPlanet=p.altitude<95;
  $('interaction').hidden=state!=='flight'||(!showDepot&&!showPlanet);
  if(!$('interaction').hidden){
    const ready=showDepot?canDock(d.range,d.relativeSpeed):canLand(p.altitude,p.relativeSpeed);
    $('interaction-title').textContent=showDepot?d.station.name:'Approaching '+p.planet.name;
    $('interaction-detail').textContent=ready?'Approach captured. Press F when ready.':showDepot?'Close within 120 u and brake to match the depot.':'Close within 55 u and brake to match orbit.';
    $('land').disabled=!ready;$('land').innerHTML=(ready?showDepot?'Dock & refuel':'Land':'Brake / approach')+' <kbd>F</kbd>';
  }
}
$('launch').onclick=start;$('pause').onclick=pause;$('resume').onclick=()=>state==='disabled'?respawn():pause();$('respawn').onclick=respawn;
$('map-button').onclick=openMap;$('change-target').onclick=openMap;$('expand-map').onclick=openMap;$('close-map').onclick=closeMap;$('next-world').onclick=openMap;
$('align').onclick=alignCourse;$('land').onclick=interact;$('takeoff').onclick=interact;$('cruise').onclick=toggleCruise;$('nearest-fuel').onclick=nearestFuel;
$('map-dialog').addEventListener('cancel',e=>{e.preventDefault();closeMap();});$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();if(state==='paused')pause();});
$('sound').onclick=()=>{muted=!muted;try{if(!muted)audioStart();}catch{muted=true;notify('Audio is unavailable in this browser.');}$('sound-label').textContent=muted?'OFF':'ON';$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');};
window.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement)return;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&!$('map-dialog').open)e.preventDefault();if(e.repeat)return;
  if(e.code==='KeyM'){e.preventDefault();openMap();return;}if($('map-dialog').open)return;
  if(e.code==='Enter'&&state==='menu'){e.preventDefault();start();return;}
  if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();pause();return;}
  if(e.code==='KeyF'){interact();return;}if(e.code==='KeyR'){alignCourse();return;}if(e.code==='KeyC'){toggleCruise();return;}if(e.code==='KeyN'){nearestFuel();return;}
  if(state==='flight')keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{clearInput();if(state==='flight'&&!$('map-dialog').open)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='flight'&&!$('map-dialog').open)pause();});
function moveStick(e){const r=$('joystick').getBoundingClientRect();stick.x=clamp((e.clientX-r.left-r.width/2)/32,-1,1);stick.y=clamp(-(e.clientY-r.top-r.height/2)/32,-1,1);$('stick').style.transform=`translate(${stick.x*27}px,${-stick.y*27}px)`;}
$('joystick').addEventListener('pointerdown',e=>{$('joystick').setPointerCapture(e.pointerId);moveStick(e);});$('joystick').addEventListener('pointermove',e=>{if($('joystick').hasPointerCapture(e.pointerId))moveStick(e);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('joystick').addEventListener(ev,()=>{stick.x=stick.y=0;$('stick').style.transform='';});
for(const [id,set] of [['touch-boost',v=>boostHeld=v],['touch-brake',v=>brakeHeld=v]]){$(id).addEventListener('pointerdown',e=>{$(id).setPointerCapture(e.pointerId);set(true);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])$(id).addEventListener(ev,()=>set(false));}
const mars=planetById.get('mars');ship.position.copy(mars.root.position).add(new THREE.Vector3(0,18,mars.radius+125));orient(mars.root.position.clone().sub(ship.position));velocity.copy(orbitalVelocity(mars,simTime));camera.position.copy(ship.position).add(new THREE.Vector3(-10,6,17).applyQuaternion(ship.quaternion));world.resetTrail();refreshRoute();navigation.refreshList(visited,checkpointHits);updateHud();
function tick(){
  requestAnimationFrame(tick);const elapsed=Math.min(clock.getDelta(),.1);visualTime+=elapsed;
  const frozen=$('map-dialog').open||state==='paused'||state==='disabled'||state==='menu';
  if(frozen)accumulator=0;
  else{
    accumulator+=elapsed;
    while(accumulator>=1/60){const dt=1/60;simTime+=dt;world.updatePlanets(simTime);if(state==='flight')simulate(dt);else if(service)updateService(dt);else if(landing)updateDock(dt);accumulator-=dt;}
    routeTimer+=elapsed;if(routeTimer>3&&state==='flight')refreshRoute();
  }
  model.rotation.y=state==='menu'?Math.sin(visualTime*.35)*.07:0;
  updateCamera(elapsed);world.animate(visualTime,state==='menu'?22:velocity.length(),boosting&&state==='flight'&&!frozen,!!service||['landed','landing'].includes(state)||state==='paused'&&pausedFrom==='landed');renderer.render(scene,camera);
  uiAccumulator+=elapsed;if(uiAccumulator>.1){updateHud();updateMarkers();navigation.draw();uiAccumulator=0;}
  toastTime-=elapsed;if(toastTime<=0)$('toast').classList.remove('show');
  if(engineGain){engineGain.gain.setTargetAtTime(!muted&&state==='flight'&&!frozen?(boosting?.05:.02):0,audioCtx.currentTime,.12);engineOsc.frequency.setTargetAtTime(cruise?100:boosting?85:35+Math.min(velocity.length(),200)*.3,audioCtx.currentTime,.15);}
}
tick();window.addEventListener('resize',()=>{world.resize();navigation.draw();});
const modelContext=document.modelContext;
if(modelContext?.registerTool){
  const lifecycle=new AbortController();const register=t=>{try{Promise.resolve(modelContext.registerTool(t,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:'read_expedition_status',description:'Read flight, destination, current fuel stop, fuel, range, hull, and checkpoint.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(){return {state,mapOpen:$('map-dialog').open,target:selected,nextStop:navigationTarget().name,speed:Math.round(velocity.length()),fuel:Math.round(fuel),rangeAU:fuelRange(fuel)/AU,hull:Math.round(health),cruise,visited:[...visited],checkpoint:checkpoint.name,depots:checkpoints.length};}});
  register({name:'select_destination',description:'Plot a planet or asteroid depot in the visible navigation HUD. Does not move the ship.',inputSchema:{type:'object',properties:{type:{enum:['planet','checkpoint']},id:{type:'string'}},required:['type','id'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!['planet','checkpoint'].includes(input.type)||typeof input.id!=='string'||Object.keys(input).length!==2)throw new Error('Supply a destination type and id');selectTarget(input.type,input.id);return {target:selected,name:currentTarget().name};}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
