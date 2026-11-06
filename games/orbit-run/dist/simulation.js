// Pure navigation and collision helpers, shared by the game and regression tests.
export const PLANETS = [
 {id:'mercury',name:'Mercury',type:'CRATERED WORLD',radius:11,orbit:145,rate:.094,phase:2.4,color:'#bda995',kind:0,desc:'A small, scarred world in the glare of the Sun. The inner orbit moves fast—lead your approach.'},
 {id:'venus',name:'Venus',type:'CLOUD WORLD',radius:18,orbit:225,rate:.076,phase:4.9,color:'#edbe79',kind:1,desc:'An amber world beneath a thick veil of clouds. Touch down on a floating atmospheric platform.'},
 {id:'earth',name:'Earth',type:'OCEAN WORLD',radius:22,orbit:330,rate:.058,phase:.6,color:'#69c7ef',kind:2,desc:'Blue oceans, green continents, and a familiar place to catch your breath. Your first port in the system.'},
 {id:'mars',name:'Mars',type:'DESERT WORLD',radius:16,orbit:435,rate:.049,phase:1.8,color:'#f18963',kind:3,desc:'Rusted valleys beneath a thin atmosphere. A quiet frontier, waiting for its first story.'},
 {id:'jupiter',name:'Jupiter',type:'GAS GIANT',radius:48,orbit:640,rate:.028,phase:3.8,color:'#deb69b',kind:4,desc:'Immense storms flow across bands of cloud. Dock at an atmospheric station above the gas giant.'},
 {id:'saturn',name:'Saturn',type:'RINGED GIANT',radius:39,orbit:850,rate:.022,phase:5.45,color:'#ead59b',kind:4,rings:true,desc:'A golden giant encircled by ice. Your landing platform floats above its cloud tops.'},
 {id:'uranus',name:'Uranus',type:'ICE GIANT',radius:28,orbit:1050,rate:.017,phase:2.75,color:'#88e0dc',kind:5,rings:true,desc:'A pale cyan world tilted into the dark. Dock above the atmosphere at the outer-system station.'},
 {id:'neptune',name:'Neptune',type:'ICE GIANT',radius:27,orbit:1240,rate:.015,phase:4.8,color:'#638fff',kind:5,desc:'Deep blue winds at the edge of the chart. A remote platform marks the farthest port from home.'}
];
export const CHECKPOINTS = [
 {id:'cp1',name:'Kepler Anchorage',position:[270,18,70],normal:[0,0,1]},
 {id:'cp2',name:'Redrock Relay',position:[-440,-12,120],normal:[1,0,0]},
 {id:'cp3',name:'Pioneer Rest',position:[400,20,-440],normal:[0,0,1]},
 {id:'cp4',name:'Cassini Crossing',position:[-740,10,-330],normal:[1,0,0]},
 {id:'cp5',name:'Voyager Beacon',position:[810,-15,750],normal:[0,0,1]}
];
export function orbitalPosition(p,t){const a=p.phase+p.rate*t;return {x:Math.cos(a)*p.orbit,y:0,z:Math.sin(a)*p.orbit};}
export function orbitalVelocity(p,t){const a=p.phase+p.rate*t;return {x:-Math.sin(a)*p.orbit*p.rate,y:0,z:Math.cos(a)*p.orbit*p.rate};}
export function interceptTime(relative,velocity,speed){const a=velocity.x**2+velocity.y**2+velocity.z**2-speed**2,b=2*(relative.x*velocity.x+relative.y*velocity.y+relative.z*velocity.z),c=relative.x**2+relative.y**2+relative.z**2;
 if(Math.abs(a)<1e-8)return b<0?-c/b:0;const d=b*b-4*a*c;if(d<0)return 0;const roots=[(-b-Math.sqrt(d))/(2*a),(-b+Math.sqrt(d))/(2*a)].filter(t=>t>0);return roots.length?Math.min(...roots):0;}
export function leadPosition(p,t,ship,speed){const now=orbitalPosition(p,t),rel={x:now.x-ship.x,y:now.y-ship.y,z:now.z-ship.z};let dt=Math.min(30,interceptTime(rel,orbitalVelocity(p,t),Math.max(speed,35)));for(let i=0;i<3;i++){const q=orbitalPosition(p,t+dt);dt=Math.min(30,Math.hypot(q.x-ship.x,q.y-ship.y,q.z-ship.z)/Math.max(speed,35))}return orbitalPosition(p,t+dt);}
export function sweptGateCrossing(a,b,center,normal,radius,shipRadius=1.25){const da=(a.x-center.x)*normal.x+(a.y-center.y)*normal.y+(a.z-center.z)*normal.z,db=(b.x-center.x)*normal.x+(b.y-center.y)*normal.y+(b.z-center.z)*normal.z;if(da*db>0||Math.abs(da-db)<1e-8)return false;const u=da/(da-db);if(u<0||u>1)return false;const x=a.x+(b.x-a.x)*u-center.x,y=a.y+(b.y-a.y)*u-center.y,z=a.z+(b.z-a.z)*u-center.z;return x*x+y*y+z*z<=(radius-shipRadius)**2;}
export function segmentSphereHit(a,b,center,radius){const x=b.x-a.x,y=b.y-a.y,z=b.z-a.z,den=x*x+y*y+z*z;const t=den?Math.max(0,Math.min(1,((center.x-a.x)*x+(center.y-a.y)*y+(center.z-a.z)*z)/den)):0;return Math.hypot(a.x+x*t-center.x,a.y+y*t-center.y,a.z+z*t-center.z)<=radius;}
export function canLand(surfaceDistance,relativeSpeed){return surfaceDistance<=38&&surfaceDistance>=-2&&relativeSpeed<=28;}
export function segmentSphereEntry(a,b,radius){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,A=dx*dx+dy*dy+dz*dz,C=a.x*a.x+a.y*a.y+a.z*a.z-radius*radius;if(C<=0)return 0;if(A<1e-12)return null;const B=2*(a.x*dx+a.y*dy+a.z*dz),D=B*B-4*A*C;if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;}
