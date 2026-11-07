// Mars surface policy. Local units are metres; these coordinates never enter
// the solar-system renderer. Kept free of browser/Three.js dependencies.
export const MARS_SAVE_KEY = 'orbit-run.mars.v1';
export const MARS_LIMIT = 2200;
export const ROVER_SPAWN = Object.freeze({x:-121,z:118,heading:-.42,speed:0});
export const ROVER = Object.freeze({radius:2.8,maxSpeed:18,reverseSpeed:7,acceleration:5.5,braking:19,drag:1.7,turnRate:.88});
export const SITES = [
  {id:'workshop',name:'Vehicle workshop',short:'WORKSHOP',x:-88,z:55,color:'#ffd08c',description:'Service bay 02. Equipment, spare parts and the people who keep Hearth moving.'},
  {id:'solar',name:'East solar field',short:'SOLAR FIELD',x:180,z:28,color:'#91e1d4',description:'Two hundred and sixteen arrays feed the settlement. One isolated bank is waiting for a replacement controller.'},
  {id:'habitat',name:'Habitat commons',short:'HABITATS',x:20,z:38,color:'#dae5e8',description:'A little warmth in the red. Homes, greenhouses and a shared radio link to the rest of the system.'},
  {id:'expansion',name:'The third ring',short:'EXPANSION',x:-65,z:-140,color:'#ffbb6b',description:'The foundations are ready. One day, every empty frame here will be someone’s home.'},
  {id:'overlook',name:'Crater overlook',short:'OVERLOOK',x:-260,z:-230,color:'#c8daf1',description:'Beyond the roofs and service roads, Mars stretches out in every direction.'},
  {id:'lander',name:'Lander berth',short:'LANDER',x:-130,z:110,color:'#bfd2e9',description:'Your connection to the waiting orbital ship. Park here when you are ready to leave.'},
];
// Later districts are deliberately separated by rover journeys, rather than a larger spawn plaza.
export const DISTRICTS = [
  {id:'residential',name:'West residential quarter',short:'WEST HOMES',x:-490,z:-140,bx:-490,bz:-265,hx:95,hz:90,kind:'homes',color:'#e9cfab',description:'Shielded pressure modules, shared courtyards and the families building a life here.'},
  {id:'clinic',name:'Medical & EVA station',short:'MEDICAL / EVA',x:-490,z:-420,bx:-490,bz:-470,hx:35,hz:28,kind:'clinic',color:'#c1e2dd',description:'A medical module, suit maintenance and dust-control airlocks. Every outside shift starts with a buddy check.'},
  {id:'gardens',name:'South grow campus',short:'GROW CAMPUS',x:270,z:-500,bx:270,bz:-570,hx:64,hz:40,kind:'farm',color:'#b9d49e',description:'LED-lit crop houses and seed trials. Transparent visitor bays are a visual simplification, not the whole food system.'},
  {id:'water',name:'Ice & water works',short:'WATER WORKS',x:700,z:-500,bx:700,bz:-570,hx:52,hz:35,kind:'water',color:'#b4d9eb',description:'A fictional local ice resource feeds extraction, filtration and recycling. Every tank has a second job as reserve.'},
  {id:'oxygen',name:'Atmosphere works',short:'OXYGEN WORKS',x:850,z:-160,bx:850,bz:-220,hx:50,hz:32,kind:'oxygen',color:'#bde0ce',description:'CO₂ intake, oxygen separation and storage. Inspired by MOXIE; a settlement-scale plant is still speculative.'},
  {id:'freight',name:'South freight terminal',short:'FREIGHT',x:650,z:380,bx:650,bz:315,hx:70,hz:40,kind:'freight',color:'#e9bb8d',description:'Cargo manifests, rover trailers and the slow arrival of things no one can make here yet.'},
  {id:'relay',name:'North science relay',short:'SCIENCE RELAY',x:100,z:-940,bx:100,bz:-1000,hx:32,hz:30,kind:'science',color:'#c8c4e5',description:'An isolated instrument station listens to the sky and studies the ground beneath the settlement.'},
  {id:'shelter',name:'Regolith shelter',short:'SHELTER',x:-800,z:-540,bx:-800,bz:-600,hx:43,hz:35,kind:'shelter',color:'#d2b798',description:'An earth-covered refuge and quiet archive. Local soil supplies shielding; the pressure vessel remains inside.'},
  {id:'quarry',name:'Materials & print yard',short:'PRINT YARD',x:-950,z:410,bx:-950,bz:345,hx:65,hz:38,kind:'quarry',color:'#ddb894',description:'Regolith sorting, test bricks and robotic construction trials. Most vital components still arrive from off-world.'},
  {id:'reactor',name:'Remote power reserve',short:'POWER RESERVE',x:1160,z:-700,bx:1160,bz:-770,hx:45,hz:35,kind:'reactor',color:'#d6c6a0',description:'A distant, bermed fission-power concept backs up life support. The repaired solar bank supplies expansion capacity.'},
];
SITES.push(...DISTRICTS.map(({bx,bz,hx,hz,kind,...site})=>site));
export const SITE_BY_ID = new Map(SITES.map(p=>[p.id,p]));
export const HABITATS = [
  {x:-14,z:-25,rotation:0},{x:26,z:-25,rotation:0},
  {x:-14,z:-78,rotation:0},{x:26,z:-78,rotation:0},
  ...[-550,-490,-430].flatMap(x=>[-215,-280,-345].map(z=>({x,z,rotation:0}))),
  ...[-230,-180].flatMap(x=>[-340,-395,-450].map(z=>({x,z,rotation:0}))),
];
export const SOLAR = Object.freeze({columns:18,rows:12,x:213,z:-38,dx:14,dz:14});
export const ROADS = [
  [[-130,110],[-120,92],[-88,55],[-60,55],[-43,20],[0,15],[80,18],[145,28],[180,28]],
  [[0,15],[3,-45],[0,-110],[-30,-137],[-65,-140]],
  [[-65,-140],[-135,-167],[-210,-195],[-260,-230]],
  [[180,28],[194,40],[194,-15],[194,-100],[194,-205],[300,-215],[462,-215]],
  [[-43,20],[-43,160],[-43,220],[-200,220],[-350,220],[-350,0],[-350,-140],[-490,-140]],
  [[-350,-140],[-350,-280],[-350,-420],[-490,-420],[-610,-420],[-660,-420],[-660,-540],[-800,-540]],
  [[180,28],[150,28],[150,-50],[150,-300],[270,-360],[270,-500]],
  [[270,-500],[480,-500],[700,-500],[700,-330],[700,-160],[850,-160]],
  [[-43,220],[160,220],[400,380],[650,380]],
  [[150,-300],[100,-420],[100,-750],[100,-940]],
  [[-350,220],[-600,410],[-950,410]],
  [[700,-500],[1000,-500],[1160,-600],[1160,-700]],
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export function terrainHeight(x,z){
  const r=Math.hypot(x-30,z+50),rough=.65+smooth(1250,1900,r)*7;
  const waves=Math.sin(x*.011)*Math.cos(z*.008)*rough+Math.sin((x+z)*.026)*rough*.23;
  const angle=Math.atan2(z+50,x-30);
  const rim=105*Math.exp(-(((r-1900)/210)**2))*(.85+.28*Math.sin(angle*7)+.14*Math.cos(angle*13));
  const field=(1-smooth(0,35,Math.max(175-x,x-470,-230-z,z-45)));
  return waves*(1-field*.94)+rim;
}
export function solarPositions(){
  return Array.from({length:SOLAR.columns*SOLAR.rows},(_,i)=>({x:SOLAR.x+i%SOLAR.columns*SOLAR.dx,z:SOLAR.z-Math.floor(i/SOLAR.columns)*SOLAR.dz}));
}
export function distanceToRoad(x,z){
  let nearest=Infinity;
  for(const road of ROADS)for(let i=1;i<road.length;i++){
    const [ax,az]=road[i-1],[bx,bz]=road[i],dx=bx-ax,dz=bz-az;
    const t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);
    nearest=Math.min(nearest,Math.hypot(x-ax-dx*t,z-az-dz*t));
  }
  return nearest;
}
export function makeMarsRocks(){
  let seed=49;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},rocks=[];
  for(let i=0;i<1900;i++){
    const a=random()*Math.PI*2,r=1300+random()*1300,size=.5+random()*4,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const rotation=[random(),random()*6,random()];
    if(distanceToRoad(x,z)<18+size||DISTRICTS.some(d=>Math.abs(x-d.bx)<d.hx+25&&Math.abs(z-d.bz)<d.hz+25))continue;
    rocks.push({x,z,size,rotation,y:terrainHeight(x,z)+size*.2-1.2});
  }
  return rocks;
}
export const MARS_ROCKS=makeMarsRocks();
export const OBSTACLES = [
  ...DISTRICTS.filter(d=>d.kind!=='homes').map(d=>({x:d.bx,z:d.bz,hx:d.hx,hz:d.hz,id:d.id})),
  ...HABITATS.map(h=>({x:h.x,z:h.z,hx:10,hz:18,id:'habitat'})),
  {x:-88,z:22,hx:23,hz:18,id:'workshop'},
  {x:95,z:-68,hx:22,hz:22,id:'greenhouse'},
  {x:55,z:-5,hx:9,hz:9,id:'communications'},
  {x:177,z:3,hx:7,hz:8,id:'solar-control'},
  {x:-150,z:125,hx:10,hz:10,id:'lander'},
  ...solarPositions().map(p=>({...p,hx:5.7,hz:3.7,id:'panel'})),
  ...Array.from({length:10},(_,i)=>({x:-115+i*7,z:-224,hx:1.5,hz:4,id:'construction-stock'})),
  ...Array.from({length:6},(_,i)=>({x:215+i*7,z:20,hx:2,hz:3,id:'battery'})),
  ...MARS_ROCKS.filter(r=>r.size>2.5&&Math.hypot(r.x,r.z)<MARS_LIMIT).map(r=>({x:r.x,z:r.z,hx:r.size*.65,hz:r.size*.65,id:'boulder'})),
  ...[-110,-72,-34].map(x=>({x,z:-185,hx:14,hz:18,id:'construction'})),
];
export function collides(x,z,radius=ROVER.radius){
  return OBSTACLES.some(b=>Math.hypot(x-clamp(x,b.x-b.hx,b.x+b.hx),z-clamp(z,b.z-b.hz,b.z+b.hz))<radius);
}
export function stepRover(state,input,elapsed){
  const next={...state,blocked:false};let remaining=clamp(elapsed,0,.25);
  while(remaining>1e-8){
    const dt=Math.min(remaining,1/60);remaining-=dt;
    const throttle=clamp(input.throttle||0,-1,1),steer=clamp(input.steer||0,-1,1);
    let target=throttle>0?ROVER.maxSpeed*throttle:throttle<0?ROVER.reverseSpeed*throttle:0;
    const rate=input.brake?ROVER.braking:throttle===0?ROVER.drag:Math.sign(next.speed)!==Math.sign(target)&&Math.abs(next.speed)>1?10:ROVER.acceleration;
    if(input.brake)target=0;
    next.speed+=clamp(target-next.speed,-rate*dt,rate*dt);
    if(Math.abs(next.speed)<.03)next.speed=0;
    next.heading+=steer*ROVER.turnRate*Math.min(Math.abs(next.speed)/7,1)*Math.sign(next.speed)*dt;
    const dx=-Math.sin(next.heading)*next.speed*dt,dz=-Math.cos(next.heading)*next.speed*dt;
    const oldHeight=terrainHeight(next.x,next.z),travel=Math.hypot(dx,dz);
    if(travel&&Math.abs(terrainHeight(next.x+dx,next.z+dz)-oldHeight)/travel>.8){next.speed*=.8;next.blocked=true;continue;}
    if(!collides(next.x+dx,next.z))next.x+=dx;else{next.speed*=.4;next.blocked=true;}
    if(!collides(next.x,next.z+dz))next.z+=dz;else{next.speed*=.4;next.blocked=true;}
    const radius=Math.hypot(next.x,next.z);
    if(radius>MARS_LIMIT){next.x*=MARS_LIMIT/radius;next.z*=MARS_LIMIT/radius;next.speed=0;next.blocked=true;}
  }
  return next;
}
export function missionForStage(stage){
  return [
    {target:'workshop',title:'A little more daylight',detail:'Collect a replacement array controller from the workshop.',step:'01 / COLLECT'},
    {target:'solar',title:'Power to the east field',detail:'Carry the controller to the solar field service station.',step:'02 / DELIVER'},
    {target:'expansion',title:'Room to grow',detail:'The array is online. Visit the third ring construction site.',step:'03 / SURVEY'},
    {target:'lander',title:'The lights stay on',detail:'Construction power is restored. Explore Hearth, or return to your lander.',step:'SERVICE COMPLETE'},
  ][clamp(stage,0,3)];
}
export function canInteract(rover,site){return Math.hypot(rover.x-site.x,rover.z-site.z)<=13&&Math.abs(rover.speed)<1.6;}
export function interactMars(stage,rover,id){
  const site=SITE_BY_ID.get(id);
  if(!site||!canInteract(rover,site))return {stage,ok:false,message:'Park beside the service beacon to interact.'};
  if(id==='workshop'&&stage===0)return {stage:1,ok:true,message:'MARA / Controller loaded. Take the east service road to the solar field.'};
  if(id==='solar'&&stage===1)return {stage:2,ok:true,message:'MARA / East bank responding. You brought construction power back online.'};
  if(id==='expansion'&&stage===2)return {stage:3,ok:true,message:'MARA / Imagine the lights on in every one of these frames. That’s what we’re building.'};
  const messages={
    workshop:stage>0?'WORKSHOP / Your rover is serviced. The next crew can take it from here.':'WORKSHOP / Replacement controller ready for collection.',
    solar:stage===0?'FIELD CONTROL / Replacement controller required. Collect it from the workshop.':'FIELD CONTROL / East bank online. Settlement supply is stable.',
    expansion:'MARA / These are the foundations of the third ring. The reactor cores will make the next stage possible.',
    habitat:'MARA / Welcome to Hearth. Take your time. There’s a warm light in every window for a reason.',
    overlook:'HEARTH RADIO / It’s quiet up here. Home is the little cluster of lights behind you.',
    lander:'LANDER / Ready for return to departure orbit.',
  };
  return {stage,ok:true,message:messages[id]||`${site.short} / ${site.description}`,depart:id==='lander'};
}
export function defaultMarsSave(){return {version:1,stage:0,rover:{...ROVER_SPAWN},target:'workshop',visited:[]};}
export function decodeMarsSave(json){
  const fallback=defaultMarsSave();
  try{
    const data=JSON.parse(json);
    if(data?.version!==1||!Number.isInteger(data.stage)||data.stage<0||data.stage>3)return fallback;
    fallback.visited=Array.isArray(data.visited)?[...new Set(data.visited.filter(id=>SITE_BY_ID.has(id)))]:[];
    fallback.stage=data.stage;fallback.target=missionForStage(data.stage).target;
    const r=data.rover;
    if(r&&['x','z','heading'].every(k=>Number.isFinite(r[k]))&&Math.hypot(r.x,r.z)<MARS_LIMIT&&!collides(r.x,r.z))fallback.rover={x:r.x,z:r.z,heading:r.heading,speed:0};
    if(SITE_BY_ID.has(data.target))fallback.target=data.target;
    return fallback;
  }catch{return fallback;}
}

// Small authored EVA loops stay beside service beacons. No pathfinding or crowds at 60 Hz.
export const CREW = [
  {id:'mara',name:'Mara Vale',role:'Rover mechanic',site:'workshop',x:-77,z:61,color:'#dc9562',line:'Every rover has a sound it makes before something goes wrong. Yours sounds ready for a long drive.'},
  {id:'ivo',name:'Ivo Sen',role:'Array technician',site:'solar',x:166,z:40,color:'#a7d8ce',line:'Dust is patient. We have to be more patient. A clean array means another evening with the lights on.'},
  {id:'jun',name:'Jun Park',role:'Construction lead',site:'expansion',x:-51,z:-129,color:'#e6b96f',line:'Those frames are future kitchens, bedrooms, arguments over dinner. We are making room for ordinary lives.'},
  {id:'nia',name:'Nia Okafor',role:'Habitat coordinator',site:'residential',x:-477,z:-130,color:'#d2b1ce',line:'People call this the west quarter. The children call it home. I like their name better.'},
  {id:'leila',name:'Dr Leila Noor',role:'Medic & EVA officer',site:'clinic',x:-477,z:-410,color:'#99cbc9',line:'The suit keeps Mars outside. The buddy check keeps you coming home. Never rush either one.'},
  {id:'tao',name:'Tao Reyes',role:'Grow technician',site:'gardens',x:284,z:-488,color:'#a8c58b',line:'We save every drop. The green you can see is the visitor bay; the hard work happens under insulated roofs.'},
  {id:'sana',name:'Sana Idris',role:'Water systems engineer',site:'water',x:714,z:-488,color:'#9fcbe2',line:'This is a closed loop with people inside it. We measure what we recover before we talk about what we can spend.'},
  {id:'orin',name:'Orin Hale',role:'Atmosphere engineer',site:'oxygen',x:865,z:-148,color:'#add0be',line:'The little experiment came first. Then years of engineering. Breathing should never depend on one machine.'},
  {id:'bea',name:'Bea Costa',role:'Freight dispatcher',site:'freight',x:664,z:393,color:'#dfaa86',line:'A box of seals came with a handwritten note from Earth. The crew kept the note. I kept the seals.'},
  {id:'eli',name:'Eli Mercer',role:'Field scientist',site:'relay',x:114,z:-928,color:'#b7afd9',line:'The quiet here is useful. Stay a minute. You can almost forget how far the next voice has to travel.'},
  {id:'ada',name:'Ada Sol',role:'Materials researcher',site:'quarry',x:-936,z:422,color:'#d6b37f',line:'We are teaching local soil to become useful walls. It takes more testing than the pretty pictures suggest.'},
  {id:'ren',name:'Ren Adebayo',role:'Power systems engineer',site:'reactor',x:1174,z:-688,color:'#cfc3a1',line:'We keep this site away from the homes. Redundant power is how the settlement gets to have uneventful nights.'},
];
export function crewPosition(person,time){
  const phase=time*.18+CREW.indexOf(person)*.7;
  return {x:person.x+Math.sin(phase)*2.4,z:person.z+Math.cos(phase)*1.2,heading:Math.atan2(-2.4*Math.cos(phase),1.2*Math.sin(phase))};
}
export function nearbyCrew(rover,time){
  let nearest=null;
  for(const person of CREW){const position=crewPosition(person,time),distance=Math.hypot(rover.x-position.x,rover.z-position.z);if(distance<=19&&(!nearest||distance<nearest.distance))nearest={person,distance};}
  return nearest;
}
