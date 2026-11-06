// Mars surface policy. Local units are metres; these coordinates never enter
// the solar-system renderer. Kept free of browser/Three.js dependencies.
export const MARS_SAVE_KEY = 'orbit-run.mars.v1';
export const MARS_LIMIT = 960;
export const ROVER_SPAWN = Object.freeze({x:-120,z:125,heading:-.42,speed:0});
export const ROVER = Object.freeze({radius:2.8,maxSpeed:18,reverseSpeed:7,acceleration:5.5,braking:19,drag:1.7,turnRate:.88});
export const SITES = [
  {id:'workshop',name:'Vehicle workshop',short:'WORKSHOP',x:-88,z:55,color:'#ffd08c',description:'Service bay 02. Equipment, spare parts and the people who keep Hearth moving.'},
  {id:'solar',name:'East solar field',short:'SOLAR FIELD',x:180,z:28,color:'#91e1d4',description:'Two hundred and sixteen arrays feed the settlement. One isolated bank is waiting for a replacement controller.'},
  {id:'habitat',name:'Habitat commons',short:'HABITATS',x:20,z:38,color:'#dae5e8',description:'A little warmth in the red. Homes, greenhouses and a shared radio link to the rest of the system.'},
  {id:'expansion',name:'The third ring',short:'EXPANSION',x:-65,z:-140,color:'#ffbb6b',description:'The foundations are ready. One day, every empty frame here will be someone’s home.'},
  {id:'overlook',name:'Crater overlook',short:'OVERLOOK',x:-260,z:-230,color:'#c8daf1',description:'Beyond the roofs and service roads, Mars stretches out in every direction.'},
  {id:'lander',name:'Lander berth',short:'LANDER',x:-130,z:110,color:'#bfd2e9',description:'Your connection to the waiting orbital ship. Park here when you are ready to leave.'},
];
export const SITE_BY_ID = new Map(SITES.map(p=>[p.id,p]));
export const HABITATS = [
  {x:-14,z:-25,rotation:0},{x:26,z:-25,rotation:0},
  {x:-14,z:-78,rotation:0},{x:26,z:-78,rotation:0},
];
export const SOLAR = Object.freeze({columns:18,rows:12,x:213,z:-38,dx:14,dz:14});
export const ROADS = [
  [[-130,110],[-120,92],[-88,55],[-60,55],[-43,20],[0,15],[80,18],[145,28],[180,28]],
  [[0,15],[3,-45],[0,-110],[-30,-137],[-65,-140]],
  [[-65,-140],[-135,-167],[-210,-195],[-260,-230]],
  [[180,28],[194,40],[194,-15],[194,-100],[194,-205],[300,-215],[462,-215]],
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export function terrainHeight(x,z){
  const r=Math.hypot(x-30,z+50),rough=.65+smooth(170,520,r)*7;
  const waves=Math.sin(x*.011)*Math.cos(z*.008)*rough+Math.sin((x+z)*.026)*rough*.23;
  const angle=Math.atan2(z+50,x-30);
  const rim=105*Math.exp(-(((r-800)/125)**2))*(.85+.28*Math.sin(angle*7)+.14*Math.cos(angle*13));
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
  for(let i=0;i<1050;i++){
    const a=random()*Math.PI*2,r=480+random()*800,size=.5+random()*4,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const rotation=[random(),random()*6,random()];
    if(distanceToRoad(x,z)<18+size)continue;
    rocks.push({x,z,size,rotation,y:terrainHeight(x,z)+size*.2-1.2});
  }
  return rocks;
}
export const MARS_ROCKS=makeMarsRocks();
export const OBSTACLES = [
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
  return {stage,ok:true,message:messages[id],depart:id==='lander'};
}
export function defaultMarsSave(){return {version:1,stage:0,rover:{...ROVER_SPAWN},target:'workshop'};}
export function decodeMarsSave(json){
  const fallback=defaultMarsSave();
  try{
    const data=JSON.parse(json);
    if(data?.version!==1||!Number.isInteger(data.stage)||data.stage<0||data.stage>3)return fallback;
    fallback.stage=data.stage;fallback.target=missionForStage(data.stage).target;
    const r=data.rover;
    if(r&&['x','z','heading'].every(k=>Number.isFinite(r[k]))&&Math.hypot(r.x,r.z)<MARS_LIMIT&&!collides(r.x,r.z))fallback.rover={x:r.x,z:r.z,heading:r.heading,speed:0};
    if(SITE_BY_ID.has(data.target))fallback.target=data.target;
    return fallback;
  }catch{return fallback;}
}
