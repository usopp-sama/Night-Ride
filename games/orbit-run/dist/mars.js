import * as THREE from './vendor/three.module.js';
import {MARS_SAVE_KEY,ROVER_SPAWN,SITES,SITE_BY_ID,HABITATS,SOLAR,ROADS,MARS_ROCKS,terrainHeight,solarPositions,collides,stepRover,missionForStage,canInteract,interactMars,decodeMarsSave} from './mars-world.js';

// One local scene, sharing the game's renderer and fixed-step loop.
export function createMarsSurface({renderer,onReturnToOrbit,onPause,onNotify,getMuted}){
  const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp;
  let stored=null;try{stored=localStorage.getItem(MARS_SAVE_KEY);}catch{}
  const saved=decodeMarsSave(stored);let roverState=saved.rover,stage=saved.stage,targetId=saved.target;
  let active=false,time=0,saveTimer=0,hudTimer=0,messageTimer=0,overview=false,cameraYaw=0,cameraPitch=.32,cameraDistance=17,drag=null;
  let localAudio=null,motor=null,motorGain=null;
  const keys=new Set(),touch=new Set(),cleanup=[],siteSprites=[],beacons=[];
  const scene=new THREE.Scene();scene.background=new THREE.Color('#bd8b71');scene.fog=new THREE.FogExp2('#c69b7e',.00072);
  const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.2,6500);
  scene.add(new THREE.HemisphereLight('#d4d7dd','#723b2a',2.3));
  const sunlight=new THREE.DirectionalLight('#ffe3b1',3.3);sunlight.position.set(-220,300,130);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-140;sunlight.shadow.camera.right=140;sunlight.shadow.camera.top=140;sunlight.shadow.camera.bottom=-140;sunlight.shadow.camera.near=1;sunlight.shadow.camera.far=700;sunlight.shadow.bias=-.0003;sunlight.shadow.normalBias=.12;scene.add(sunlight,sunlight.target);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(4500,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#87777e')},horizon:{value:new THREE.Color('#efb888')}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top;uniform vec3 horizon;void main(){float h=smoothstep(-.08,.7,normalize(v).y);gl_FragColor=vec4(mix(horizon,top,h),1.);}'}));scene.add(sky);
  const sun=new THREE.Mesh(new THREE.SphereGeometry(45,20,12),new THREE.MeshBasicMaterial({color:'#ffe9b2',fog:false}));sun.position.set(-2400,1300,-2000);scene.add(sun);
  const materials={
    white:new THREE.MeshStandardMaterial({color:'#ded9cd',roughness:.65,metalness:.18}),
    dark:new THREE.MeshStandardMaterial({color:'#27343c',roughness:.48,metalness:.65}),
    steel:new THREE.MeshStandardMaterial({color:'#777d7d',roughness:.5,metalness:.75}),
    orange:new THREE.MeshStandardMaterial({color:'#cf6741',roughness:.6,metalness:.25}),
    yellow:new THREE.MeshStandardMaterial({color:'#dfac5e',roughness:.6,metalness:.25}),
    window:new THREE.MeshStandardMaterial({color:'#31515b',roughness:.2,metalness:.75,emissive:'#3a8282',emissiveIntensity:.3}),
    warm:new THREE.MeshStandardMaterial({color:'#ffe6ae',emissive:'#ffcc79',emissiveIntensity:.75}),
    cyan:new THREE.MeshStandardMaterial({color:'#9be4d3',emissive:'#66cabb',emissiveIntensity:1.1}),
    rubber:new THREE.MeshStandardMaterial({color:'#263034',roughness:1}),
    concrete:new THREE.MeshStandardMaterial({color:'#998777',roughness:1}),
  };
  function mesh(geometry,material,position,parent=scene){const m=new THREE.Mesh(geometry,material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,material,position,parent=scene){return mesh(new THREE.BoxGeometry(w,h,d),material,position,parent);}
  function cylinder(r,h,material,position,parent=scene,segments=12){return mesh(new THREE.CylinderGeometry(r,r,h,segments),material,position,parent);}
  function groundGroup(x,z){const root=new THREE.Group();root.position.set(x,terrainHeight(x,z),z);scene.add(root);return root;}
  function lineBetween(a,b,color='#b9b5a8',parent=scene){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color}));parent.add(l);return l;}
  function textTexture(text,bg='#223b43',fg='#e4f0e6'){
    const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,768,128);ctx.fillStyle=fg;ctx.font='600 43px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,64,730);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  function sign(text,x,y,z,w=15,parent=scene){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/6),new THREE.MeshBasicMaterial({map:textTexture(text)}));m.position.set(x,y,z);parent.add(m);return m;}
  function label(text,site){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:textTexture(text,'#243b41','#c7eadb'),transparent:false,depthTest:true}));sprite.position.set(site.x,terrainHeight(site.x,site.z)+6,site.z);sprite.scale.set(6,1,1);scene.add(sprite);siteSprites.push({sprite,site});}

  const terrainGeo=new THREE.PlaneGeometry(2700,2700,200,200);terrainGeo.rotateX(-Math.PI/2);const p=terrainGeo.attributes.position,colors=[];
  const low=new THREE.Color('#9b5940'),high=new THREE.Color('#c98c65'),color=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=terrainHeight(x,z);p.setY(i,h);const mix=.38+.2*Math.sin(x*.026+z*.019)+.15*Math.cos(x*.08-z*.04)+Math.min(h/180,.3);color.copy(low).lerp(high,clamp(mix,0,1));colors.push(color.r,color.g,color.b);}
  const soilCanvas=document.createElement('canvas');soilCanvas.width=soilCanvas.height=256;const soilCtx=soilCanvas.getContext('2d'),soilPixels=soilCtx.createImageData(256,256);let soilSeed=91;
  for(let i=0;i<soilPixels.data.length;i+=4){soilSeed=(Math.imul(soilSeed,1664525)+1013904223)>>>0;const shade=188+(soilSeed>>>24)/255*58;soilPixels.data[i]=shade;soilPixels.data[i+1]=shade;soilPixels.data[i+2]=shade;soilPixels.data[i+3]=255;}
  soilCtx.putImageData(soilPixels,0,0);const soilTexture=new THREE.CanvasTexture(soilCanvas);soilTexture.wrapS=soilTexture.wrapT=THREE.RepeatWrapping;soilTexture.repeat.set(120,120);soilTexture.colorSpace=THREE.SRGBColorSpace;soilTexture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeo.computeVertexNormals();const terrain=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:soilTexture}));terrain.receiveShadow=true;scene.add(terrain);
  function road(points){
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),positions=[],uv=[],indices=[];
    for(let i=0;i<=160;i++){
      const t=i/160,q=curve.getPoint(t),d=curve.getTangent(t),nx=-d.z,nz=d.x;
      for(const side of [-1,1]){const x=q.x+nx*4.5*side,z=q.z+nz*4.5*side;positions.push(x,terrainHeight(x,z)+.09,z);uv.push(side<0?0:1,t*20);}
      if(i<160){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#b38c6d',roughness:1,side:THREE.DoubleSide}));m.receiveShadow=true;scene.add(m);
    for(let i=0;i<curve.getLength()/30;i++){
      const t=i/Math.ceil(curve.getLength()/30),q=curve.getPointAt(t),d=curve.getTangentAt(t);
      for(const side of [-1,1]){const x=q.x-d.z*5.7*side,z=q.z+d.x*5.7*side;const pole=cylinder(.15,1.2,materials.white,[x,terrainHeight(x,z)+.6,z]);pole.castShadow=false;const reflector=box(.25,.22,.25,materials.orange,[x,terrainHeight(x,z)+1.2,z]);reflector.castShadow=false;}
    }
  }
  ROADS.forEach(road);
  // Distant rocks are instanced and decorative; facility collisions use simple bounds.
  let seed=49;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const rockGeo=new THREE.IcosahedronGeometry(1,0),rockMat=new THREE.MeshStandardMaterial({color:'#885341',roughness:1,flatShading:true}),rockMesh=new THREE.InstancedMesh(rockGeo,rockMat,MARS_ROCKS.length),dummy=new THREE.Object3D();
  MARS_ROCKS.forEach((rock,i)=>{dummy.position.set(rock.x,rock.y,rock.z);dummy.scale.set(rock.size,rock.size*.65,rock.size*.8);dummy.rotation.set(...rock.rotation);dummy.updateMatrix();rockMesh.setMatrixAt(i,dummy.matrix);});rockMesh.instanceMatrix.needsUpdate=true;scene.add(rockMesh);

  // Habitats: elevated pressure vessels, service ribs and illuminated airlocks.
  for(const [i,h] of HABITATS.entries()){
    const root=groundGroup(h.x,h.z);box(19,1.4,34,materials.concrete,[0,.5,0],root);
    const body=cylinder(6,25,materials.white,[0,8,0],root,20);body.rotation.x=Math.PI/2;
    for(const z of [-12.5,12.5]){const cap=mesh(new THREE.SphereGeometry(6,20,12),materials.white,[0,8,z],root);cap.scale.set(1,1,.45);const rib=mesh(new THREE.TorusGeometry(6.08,.16,6,24),materials.dark,[0,8,z],root);}
    for(const side of [-1,1])for(const z of [-8,0,8])box(.35,1.7,3.8,materials.window,[side*5.7,8.7,z],root);
    for(const z of [-7,7]){const rib=mesh(new THREE.TorusGeometry(6.04,.09,4,24),materials.steel,[0,8,z],root);}
    box(4,5,.8,materials.dark,[0,5.8,15.2],root);box(2.7,3.6,.9,materials.warm,[0,5.6,15.7],root);
    box(6,.3,3,materials.steel,[0,2.2,17],root);box(3,1,1.5,materials.concrete,[0,1,18],root);
    sign(`HEARTH / HAB ${String(i+1).padStart(2,'0')}`,0,11,15.4,9,root);
    for(const x of [-4,4])for(const z of [-9,9])cylinder(.45,2.2,materials.dark,[x,1.6,z],root);
    box(8,.6,11,materials.dark,[0,14,0],root);
  }
  for(const [x,z] of [[6,-25],[6,-78]]){const root=groundGroup(x,z);box(28,3.5,5,materials.white,[0,10.5,0],root);box(28,.4,3.5,materials.window,[0,12.4,0],root);}
  const spine=groundGroup(-14,-51.5);box(5,3.5,28,materials.white,[0,10.5,0],spine);box(3.5,.4,28,materials.window,[0,12.4,0],spine);
  const utilityPoints=[[43,-98],[48,-65],[45,-25],[55,-10],[75,-10]].map(([x,z])=>new THREE.Vector3(x,terrainHeight(x,z)+.6,z));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(utilityPoints),48,.35,6,false),materials.steel,[0,0,0]);
  const powerCable=[[180,20],[150,10],[80,7],[65,-14]].map(([x,z])=>new THREE.Vector3(x,terrainHeight(x,z)+.18,z));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(powerCable),40,.12,5,false),materials.dark,[0,0,0]);
  const habitatSign=groundGroup(20,38);cylinder(.15,3,materials.steel,[0,1.5,0],habitatSign);sign('HEARTH / COMMONS',0,3.8,0,11,habitatSign);

  const shop=groundGroup(-88,22);box(44,1.2,34,materials.concrete,[0,.3,0],shop);
  for(const x of [-20,20])box(2,13,30,materials.white,[x,7,0],shop);
  box(40,13,2,materials.white,[0,7,-14],shop);box(43,2,34,materials.dark,[0,14.5,0],shop);
  box(43,.4,2,materials.orange,[0,13,16.3],shop);sign('02 / VEHICLE SYSTEMS',0,11,16.4,25,shop);
  for(const x of [-14,14])box(.4,8,.6,materials.cyan,[x,5,15.6],shop);
  for(const x of [-15,14]){box(6,2.8,3,materials.dark,[x,2,-6],shop);box(6,.2,3,materials.yellow,[x,3.5,-6],shop);}
  for(let i=0;i<5;i++)box(2.4,2.4,2.4,i%2?materials.orange:materials.white,[-17+i*3.7,2,-10],shop);
  const serviceCrate=box(1.6,1.1,1.2,materials.orange,[-88,terrainHeight(-88,55)+1,55]);

  // Comms is the settlement's landmark, visible above the pressure modules.
  const comms=groundGroup(55,-5);cylinder(5,6,materials.white,[0,3,0],comms);cylinder(1.3,15,materials.dark,[0,12,0],comms);
  const dish=mesh(new THREE.SphereGeometry(9,24,12,0,Math.PI*2,0,Math.PI*.36),materials.white,[0,20,0],comms);dish.rotation.z=.6;dish.rotation.x=.3;
  lineBetween([0,20,0],[4,28,0],'#535c5e',comms);mesh(new THREE.SphereGeometry(.7,8,6),materials.cyan,[4,28,0],comms);
  for(let i=0;i<3;i++){const tank=cylinder(2,9,materials.white,[68+i*5,terrainHeight(68+i*5,-8)+4.5,-8]);}

  const greenhouse=groundGroup(95,-68);cylinder(21,.8,materials.white,[0,.3,0],greenhouse,48);
  const glass=new THREE.MeshStandardMaterial({color:'#8dd6c1',emissive:'#24564b',emissiveIntensity:.25,roughness:.22,metalness:.12,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
  const domeGeo=new THREE.SphereGeometry(20,24,12,0,Math.PI*2,0,Math.PI/2);const dome=mesh(domeGeo,glass,[0,.8,0],greenhouse);dome.castShadow=false;
  const wire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(20,16,8,0,Math.PI*2,0,Math.PI/2)),new THREE.LineBasicMaterial({color:'#c8d6c6',transparent:true,opacity:.55}));wire.position.y=.8;greenhouse.add(wire);
  const crops=new THREE.MeshStandardMaterial({color:'#638d4b',roughness:1});
  for(let i=0;i<7;i++){box(2.2,.8,20,materials.dark,[-12+i*4,.9,0],greenhouse);box(1.8,.8,18,crops,[-12+i*4,1.5,0],greenhouse);}
  sign('HEARTH / GROW HOUSE',0,4,20.5,17,greenhouse);

  // A single shared solar texture and instanced panel/support meshes.
  const panelCanvas=document.createElement('canvas');panelCanvas.width=512;panelCanvas.height=256;const pc=panelCanvas.getContext('2d');pc.fillStyle='#1d354d';pc.fillRect(0,0,512,256);
  for(let r=0;r<6;r++)for(let c=0;c<12;c++){pc.fillStyle=(c+r)%3?'#25465f':'#315872';pc.fillRect(c*42+3,r*42+3,38,38);pc.fillStyle='#95afb2';pc.fillRect(c*42+21,r*42+3,1,38);}
  const panelTexture=new THREE.CanvasTexture(panelCanvas);panelTexture.colorSpace=THREE.SRGBColorSpace;panelTexture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const panelMaterial=new THREE.MeshStandardMaterial({map:panelTexture,roughness:.3,metalness:.7,emissive:'#24505d',emissiveIntensity:.12,side:THREE.DoubleSide});
  const solarPoints=solarPositions(),panels=new THREE.InstancedMesh(new THREE.BoxGeometry(11.6,.22,7.2),panelMaterial,solarPoints.length);
  const supports=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.22,3.5,6),materials.steel,solarPoints.length*2);
  const frames=new THREE.InstancedMesh(new THREE.BoxGeometry(12,.3,7.6),materials.white,solarPoints.length);
  solarPoints.forEach((p,i)=>{
    const h=terrainHeight(p.x,p.z);dummy.position.set(p.x,h+3.7,p.z);dummy.rotation.set(-.3,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();panels.setMatrixAt(i,dummy.matrix);
    dummy.position.y-=.24;dummy.updateMatrix();frames.setMatrixAt(i,dummy.matrix);
    for(let side=0;side<2;side++){dummy.rotation.set(0,0,0);dummy.position.set(p.x+(side?4:-4),h+1.8,p.z);dummy.updateMatrix();supports.setMatrixAt(i*2+side,dummy.matrix);}
  });panels.castShadow=true;panels.receiveShadow=true;frames.castShadow=true;supports.castShadow=true;scene.add(frames,panels,supports);
  const control=groundGroup(177,3);box(12,6.5,13,materials.white,[0,3.5,0],control);box(13,.6,14,materials.dark,[0,7,0],control);sign('EAST FIELD / CONTROL',0,5,6.7,11,control);
  let displayedPowerStage=-1;const fieldStatusBoard=sign('EAST BANK / ISOLATED',0,3.5,7.4,9,control);
  const powerLight=box(8,.35,.3,materials.orange,[0,2.3,6.8],control);box(2.5,3,.6,materials.dark,[0,2.6,7],control);
  for(let i=0;i<6;i++)box(4,3,6,materials.dark,[215+i*7,terrainHeight(215+i*7,20)+1.5,20]);

  // Unfinished ring: visible foundations, exposed frames and a dormant crane.
  const construction=new THREE.Group();scene.add(construction);const constructionLights=[];
  for(const x of [-110,-72,-34]){
    const root=groundGroup(x,-185);box(26,1.2,34,materials.concrete,[0,.5,0],root);
    for(const side of [-1,1])for(const z of [-14,14])box(.6,12,.6,materials.steel,[side*11,7,z],root);
    for(const z of [-14,0,14])box(23,.6,.6,materials.steel,[0,13,z],root);
    for(const side of [-1,1])box(.6,.6,29,materials.steel,[side*11,13,0],root);
    box(24,.4,8,materials.white,[0,13,-9],root);box(24,8,.5,materials.white,[0,5,-14],root);
    const lamp=box(10,.18,.25,materials.dark,[0,1.5,17.4],root);constructionLights.push(lamp);
  }
  const crane=groundGroup(-140,-175);const craneArm=new THREE.Group();craneArm.position.y=34;crane.add(craneArm);
  box(3,34,3,materials.yellow,[0,17,0],crane);box(62,2,3,materials.yellow,[12,0,0],craneArm);box(8,6,7,materials.dark,[-13,-2,0],craneArm);
  for(let y=1;y<33;y+=4){lineBetween([-1.6,y,-1.6],[1.6,y+4,-1.6],'#4d4f49',crane);lineBetween([1.6,y,-1.6],[-1.6,y+4,-1.6],'#4d4f49',crane);}
  lineBetween([40,-1,0],[40,-25,0],'#393c3d',craneArm);box(1,2,1,materials.orange,[40,-26,0],craneArm);
  for(let i=0;i<10;i++){box(3,1,8,materials.steel,[-115+i*7,terrainHeight(-115+i*7,-224)+.7,-224]);}
  const expansionSign=groundGroup(-65,-140);cylinder(.18,2.8,materials.steel,[0,1.4,0],expansionSign);sign('THIRD RING / UNDER CONSTRUCTION',0,3.5,0,25,expansionSign);

  // Surface shuttle: a visual berth now, ready for the later launch/docking milestone.
  const lander=groundGroup(-150,125);const berth=cylinder(13,.35,new THREE.MeshStandardMaterial({color:'#ad8060',roughness:1}),[0,.1,0],lander,48);
  cylinder(3.2,8,materials.white,[0,7.5,0],lander,16);mesh(new THREE.ConeGeometry(3.2,4,16),materials.dark,[0,13.5,0],lander);
  cylinder(3.28,.65,materials.orange,[0,8,0],lander,16);cylinder(1.3,2.5,materials.dark,[0,2.2,0],lander);
  for(let i=0;i<4;i++){const a=i*Math.PI/2,x=Math.cos(a)*5,z=Math.sin(a)*5;const leg=cylinder(.2,5,materials.steel,[x*.72,3,z*.72],lander,6);leg.rotation.z=-Math.cos(a)*.55;leg.rotation.x=Math.sin(a)*.55;box(3,.25,2,materials.dark,[x,.6,z],lander);}
  sign('KESTREL / SURFACE LINK',0,7.5,3.25,7,lander);

  // Six-wheel utility rover, including independent wheel terrain contact.
  const rover=new THREE.Group(),body=new THREE.Group();rover.add(body);scene.add(rover);
  box(4.7,1.2,6,materials.dark,[0,1.7,0],body);box(4.4,.8,5.8,materials.white,[0,2.5,0],body);
  box(3.5,2.1,2.9,materials.white,[0,3.8,-1.1],body);const windshield=box(3.2,1.3,.12,materials.window,[0,4,-2.62],body);windshield.rotation.x=-.13;
  for(const side of [-1,1]){box(.12,1.25,2.1,materials.window,[side*1.79,4,-1.1],body);box(.3,.32,1.2,materials.cyan,[side*1.6,2.4,-3.03],body);box(.2,.3,1.3,materials.orange,[side*2.1,2.3,1.7],body);}
  box(3.5,.35,2.1,materials.steel,[0,3.1,1.7],body);const cargo=box(2,1.2,1.6,materials.orange,[0,3.85,1.7],body);box(2.1,.14,1.7,materials.dark,[0,.65,0],cargo);cargo.visible=stage===1;
  cylinder(.06,2.3,materials.dark,[-1.5,5.8,.5],body,6);mesh(new THREE.SphereGeometry(.16,8,6),materials.cyan,[-1.5,7,.5],body);
  // Utility detailing keeps the rover legible from its normal chase camera.
  box(4.3,.3,.2,materials.orange,[0,2.5,3.02],body);box(3.8,.16,.2,materials.steel,[0,1.45,3.15],body);
  for(const side of [-1,1]){box(.42,.3,.2,materials.warm,[side*1.85,2.25,3.16],body);box(.25,1.1,1.1,materials.orange,[side*2.2,2.5,-1.6],body);box(5.9,.16,.16,materials.steel,[0,1.1,side*2.15],body);}
  const rearBadge=sign('NOMAD / 06',0,2,3.15,2.6,body);
  const roofPanel=box(2.8,.12,1.8,materials.window,[0,4.95,-1.05],body);
  box(3.5,.12,.14,materials.orange,[0,4.99,-2.3],body);
  const wheels=[],wheelGeo=new THREE.CylinderGeometry(.95,.95,.7,16),treadGeo=new THREE.TorusGeometry(.95,.11,4,16);
  for(const side of [-1,1])for(const z of [-2.15,0,2.15]){
    const pivot=new THREE.Group();pivot.position.set(side*2.65,.95,z);rover.add(pivot);const wheel=mesh(wheelGeo,materials.rubber,[0,0,0],pivot);wheel.rotation.z=Math.PI/2;
    const hub=cylinder(.48,.75,materials.white,[0,0,0],pivot,10);hub.rotation.z=Math.PI/2;
    const tread=mesh(treadGeo,materials.dark,[side*.37,0,0],pivot);tread.rotation.y=Math.PI/2;
    const arm=box(1.1,.22,.3,materials.steel,[side*2.1,1.45,z],body);
    wheels.push({pivot,wheel,hub,side,z,spin:0});
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(4.1,32),new THREE.MeshBasicMaterial({color:'#31241f',transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  const dustCount=65,dustPositions=new Float32Array(dustCount*3),dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#d5aa7d',size:1.4,transparent:true,opacity:.22,depthWrite:false}));dust.frustumCulled=false;scene.add(dust);let dustCursor=0;
  for(const site of SITES){const root=groundGroup(site.x,site.z);const ring=mesh(new THREE.TorusGeometry(2,.11,5,32),materials.cyan,[0,.18,0],root);ring.rotation.x=Math.PI/2;beacons.push({root,ring,site});label(site.short,site);}

  const waypointList=$('mars-waypoints');waypointList.replaceChildren();
  for(const site of SITES){const button=document.createElement('button');button.dataset.site=site.id;button.className='mars-waypoint';button.innerHTML=`<i style="--site-color:${site.color}"></i><span>${site.name}</span><small></small>`;button.onclick=()=>{targetId=site.id;save();refreshHud();};waypointList.appendChild(button);}
  function save(){try{localStorage.setItem(MARS_SAVE_KEY,JSON.stringify({version:1,stage,rover:roverState,target:targetId}));$('mars-save-state').textContent='FIELD LOG SAVED';}catch{$('mars-save-state').textContent='SESSION LOG';}}
  function clearInput(){keys.clear();touch.clear();drag=null;if(motorGain&&localAudio)motorGain.gain.setTargetAtTime(0,localAudio.currentTime,.05);}
  function reset(){roverState={...ROVER_SPAWN};clearInput();placeRover(0);save();onNotify('Rover recovered to the lander berth. Your cargo and progress are safe.');}
  function radio(message){$('mars-radio-text').textContent=message;$('mars-radio').hidden=false;messageTimer=10;}
  function nearestSite(){return SITES.map(site=>({site,d:Math.hypot(roverState.x-site.x,roverState.z-site.z)})).sort((a,b)=>a.d-b.d)[0];}
  function interact(){
    if($('mars-map-dialog').open)return;
    const {site}=nearestSite(),result=interactMars(stage,roverState,site.id);
    if(!result.ok){onNotify(result.message);return;}
    stage=result.stage;cargo.visible=stage===1;targetId=missionForStage(stage).target;save();refreshHud();
    if(result.depart){onReturnToOrbit();return;}
    radio(result.message);
  }
  function openMap(){
    clearInput();if($('mars-map-dialog').open){$('mars-map-dialog').close();return;}
    $('mars-map-dialog').showModal();drawMap($('mars-map'),false);
  }
  const mapClose=()=>{$('mars-map-dialog').close();clearInput();};
  $('mars-map-close').onclick=mapClose;$('mars-open-map').onclick=openMap;$('mars-map-dialog').addEventListener('cancel',cancelMap);
  function cancelMap(e){e.preventDefault();mapClose();}
  $('mars-reset').onclick=reset;$('mars-view').onclick=()=>{overview=!overview;};$('mars-interact').onclick=interact;
  function onPointerDown(e){if(!active||$('mars-map-dialog').open||e.target!==renderer.domElement)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}
  function onPointerMove(e){if(!drag||drag.id!==e.pointerId)return;cameraYaw-=(e.clientX-drag.x)*.006;cameraPitch=clamp(cameraPitch+(e.clientY-drag.y)*.004,.12,.9);drag.x=e.clientX;drag.y=e.clientY;overview=false;}
  function onPointerUp(){drag=null;}
  function onWheel(e){if(!active||e.target!==renderer.domElement)return;e.preventDefault();cameraDistance=clamp(cameraDistance+e.deltaY*.025,10,36);}
  for(const [name,handler] of [['pointerdown',onPointerDown],['pointermove',onPointerMove],['pointerup',onPointerUp],['pointercancel',onPointerUp],['wheel',onWheel]]){renderer.domElement.addEventListener(name,handler,{passive:false});cleanup.push(()=>renderer.domElement.removeEventListener(name,handler));}
  for(const button of document.querySelectorAll('[data-mars-control]')){
    const name=button.dataset.marsControl;
    const down=e=>{button.setPointerCapture(e.pointerId);touch.add(name);};const up=()=>touch.delete(name);
    button.addEventListener('pointerdown',down);for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,up);
    cleanup.push(()=>{button.removeEventListener('pointerdown',down);for(const type of ['pointerup','pointercancel','lostpointercapture'])button.removeEventListener(type,up);});
  }
  function keydown(e){
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
    if($('mars-map-dialog').open){if(e.code==='KeyM'){e.preventDefault();mapClose();}return;}
    if(e.repeat)return;
    if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();onPause();return;}
    if(e.code==='KeyM'){openMap();return;}if(e.code==='KeyF'){interact();return;}if(e.code==='KeyR'){reset();return;}
    if(e.code==='KeyV'){overview=!overview;return;}if(e.code==='KeyC'){cameraYaw=0;cameraPitch=.32;cameraDistance=17;overview=false;return;}
    keys.add(e.code);
  }
  function keyup(e){keys.delete(e.code);}
  function createMotor(){
    if(localAudio||getMuted())return;
    try{localAudio=new (window.AudioContext||window.webkitAudioContext)();motor=localAudio.createOscillator();motorGain=localAudio.createGain();const filter=localAudio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=260;motor.type='triangle';motor.frequency.value=35;motorGain.gain.value=0;motor.connect(filter);filter.connect(motorGain);motorGain.connect(localAudio.destination);motor.start();}catch{}
  }
  function placeRover(dt){
    const h=terrainHeight(roverState.x,roverState.z);rover.position.set(roverState.x,h,roverState.z);rover.rotation.y=roverState.heading;
    const c=Math.cos(roverState.heading),s=Math.sin(roverState.heading),heights=[];
    for(const w of wheels){const lx=w.side*2.65,lz=w.z,x=roverState.x+lx*c+lz*s,z=roverState.z-lx*s+lz*c;const wh=terrainHeight(x,z);heights.push(wh);w.pivot.position.y=wh-h+.95;w.pivot.rotation.y=w.z<0?((keys.has('KeyA')||keys.has('ArrowLeft')||touch.has('left')?1:0)-(keys.has('KeyD')||keys.has('ArrowRight')||touch.has('right')?1:0))*.3:0;w.spin+=roverState.speed*dt/.95;w.wheel.rotation.x=w.spin;}
    const front=(heights[0]+heights[3])/2,rear=(heights[2]+heights[5])/2,left=(heights[0]+heights[1]+heights[2])/3,right=(heights[3]+heights[4]+heights[5])/3;
    body.rotation.x=THREE.MathUtils.lerp(body.rotation.x,Math.atan2(front-rear,4.3),1-Math.exp(-8*dt));body.rotation.z=THREE.MathUtils.lerp(body.rotation.z,Math.atan2(right-left,5.3),1-Math.exp(-8*dt));
    shadow.position.set(roverState.x,h+.06,roverState.z);shadow.rotation.z=-roverState.heading;
    dust.visible=Math.abs(roverState.speed)>3;
    if(dust.visible){const a=dustCursor++%dustCount,side=a%2?1:-1,x=roverState.x+(side*2.5*c+3*s),z=roverState.z+(-side*2.5*s+3*c);dustPositions.set([x,terrainHeight(x,z)+.4+random()*.6,z],a*3);dustGeo.attributes.position.needsUpdate=true;}
  }
  function updateCamera(dt,immediate=false){
    const yaw=roverState.heading+cameraYaw,look=new THREE.Vector3(roverState.x,rover.position.y+2.6,roverState.z);
    let desired;
    if(overview){desired=new THREE.Vector3(80,420,490);look.set(50,0,-50);camera.fov=55;}
    else{const offset=new THREE.Vector3(Math.sin(yaw)*cameraDistance*Math.cos(cameraPitch),Math.sin(cameraPitch)*cameraDistance+2.5,Math.cos(yaw)*cameraDistance*Math.cos(cameraPitch));desired=look.clone().add(offset);desired.y=Math.max(desired.y,terrainHeight(desired.x,desired.z)+2.4);camera.fov=62;
      const offsetToCamera=desired.clone().sub(look),steps=Math.ceil(offsetToCamera.length());
      for(let i=3;i<steps;i++){const point=look.clone().addScaledVector(offsetToCamera,i/steps);if(point.y<terrainHeight(point.x,point.z)+16&&collides(point.x,point.z,.5)){desired=look.clone().addScaledVector(offsetToCamera,Math.max(3,i-2)/steps);break;}}
    }
    if(immediate)camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-4*dt));camera.lookAt(look);camera.updateProjectionMatrix();camera.updateMatrixWorld();sky.position.copy(camera.position);
    sunlight.position.set(roverState.x-220,rover.position.y+300,roverState.z+130);sunlight.target.position.copy(rover.position);
  }
  function drawMap(canvas,mini){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const ratio=Math.min(devicePixelRatio,2),w=rect.width,h=rect.height;if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
    const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#1b292c';ctx.fillRect(0,0,w,h);
    const scale=mini?Math.min(w,h)/790:Math.min((w-60)/850,(h-60)/500),cx=w/2-(mini?70:95)*scale,cy=h/2+(mini?60:45)*scale,xy=(x,z)=>({x:cx+x*scale,y:cy+z*scale});
    ctx.strokeStyle='#455552';ctx.lineWidth=mini?2:5;
    for(const road of ROADS){ctx.beginPath();road.forEach(([x,z],i)=>{const p=xy(x,z);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();}
    ctx.fillStyle='#a9aaa060';for(const b of HABITATS){const q=xy(b.x-9,b.z-17);ctx.fillRect(q.x,q.y,18*scale,34*scale);}
    ctx.fillStyle=stage>=2?'#6faaa1':'#425f66';for(const p of solarPoints){const q=xy(p.x-5,p.z-3);ctx.fillRect(q.x,q.y,10*scale,6*scale);}
    ctx.strokeStyle='#d3aa6f';for(const x of [-110,-72,-34]){const q=xy(x-12,-202);ctx.strokeRect(q.x,q.y,24*scale,34*scale);}
    const target=SITE_BY_ID.get(targetId),a=xy(roverState.x,roverState.z),b=xy(target.x,target.z);ctx.strokeStyle='#f4c67a88';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
    for(const site of SITES){const p=xy(site.x,site.z);ctx.fillStyle=targetId===site.id?'#f7cf89':'#b3cac3';ctx.beginPath();ctx.arc(p.x,p.y,mini?2.5:4,0,Math.PI*2);ctx.fill();if(!mini){ctx.font='10px Arial';ctx.fillText(site.short,p.x+8,p.y-7);}}
    ctx.save();ctx.translate(a.x,a.y);ctx.rotate(roverState.heading);ctx.fillStyle='#efc789';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,4);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();
    if(!mini){ctx.fillStyle='#adbdba';ctx.font='10px Arial';ctx.fillText('N ↑     /     SERVICE ROADS     /     MARS LOCAL GRID',18,h-18);}
  }
  function refreshHud(){
    const mission=missionForStage(stage),target=SITE_BY_ID.get(targetId),nearest=nearestSite();
    $('mars-mission-step').textContent=mission.step;$('mars-mission-title').textContent=mission.title;$('mars-mission-detail').textContent=mission.detail;
    $('mars-cargo').textContent=stage===1?'ARRAY CONTROLLER LOADED':'UTILITY ROVER / NOMAD 06';
    $('mars-speed').textContent=String(Math.round(Math.abs(roverState.speed)*3.6));$('mars-gear').textContent=roverState.speed<-.15?'R':Math.abs(roverState.speed)<.1?'P':'D';
    $('mars-power').textContent=stage>=2?'78%':'42%';$('mars-power-label').textContent=stage>=2?'EAST ARRAY ONLINE':'EAST ARRAY ISOLATED';
    $('mars-target-name').textContent=target.name;$('mars-target-distance').textContent=Math.round(Math.hypot(roverState.x-target.x,roverState.z-target.z))+' m';
    $('mars-coordinates').textContent=`${Math.abs(roverState.x).toFixed(0)} ${roverState.x<0?'W':'E'} / ${Math.abs(roverState.z).toFixed(0)} ${roverState.z<0?'N':'S'}`;
    $('mars-view').setAttribute('aria-pressed',String(overview));
    for(const button of waypointList.children){const site=SITE_BY_ID.get(button.dataset.site);button.classList.toggle('selected',site.id===targetId);button.setAttribute('aria-pressed',String(site.id===targetId));button.querySelector('small').textContent=Math.round(Math.hypot(roverState.x-site.x,roverState.z-site.z))+' m';}
    const near=nearest.d<21,ready=canInteract(roverState,nearest.site);$('mars-interaction').hidden=!near;
    if(near){$('mars-interaction-title').textContent=nearest.site.name;const action=nearest.site.id==='lander'?'Return to orbit':nearest.site.id==='workshop'&&stage===0?'Collect controller':nearest.site.id==='solar'&&stage===1?'Install controller':nearest.site.id==='expansion'&&stage===2?'Survey site':'Open comms';$('mars-interaction-hint').textContent=ready?'Parked at service beacon.':nearest.d>13?'Pull up to the service beacon.':'Brake to park before interacting.';$('mars-interact').disabled=!ready;$('mars-interact').innerHTML=action+' <kbd>F</kbd>';}
    const q=new THREE.Vector3(target.x,terrainHeight(target.x,target.z)+5,target.z).project(camera),front=new THREE.Vector3(target.x,terrainHeight(target.x,target.z)+5,target.z).sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3()))>0;
    $('mars-target-marker').hidden=overview||!front||q.x<-.75||q.x>.75||q.y<-.5||q.y>.6||Math.hypot(roverState.x-target.x,roverState.z-target.z)<20;
    if(!$('mars-target-marker').hidden){$('mars-target-marker').style.left=(q.x+1)*innerWidth/2+'px';$('mars-target-marker').style.top=(1-q.y)*innerHeight/2+'px';$('mars-marker-label').textContent=target.short;}
    for(const {sprite,site} of siteSprites){const d=Math.hypot(roverState.x-site.x,roverState.z-site.z);sprite.visible=d>36&&d<200&&!overview;}
    if(displayedPowerStage!==(stage>=2?1:0)){fieldStatusBoard.material.map.dispose();fieldStatusBoard.material.map=textTexture(stage>=2?'EAST BANK / ONLINE':'EAST BANK / ISOLATED');fieldStatusBoard.material.needsUpdate=true;displayedPowerStage=stage>=2?1:0;}
    panelMaterial.emissiveIntensity=stage>=2?.32:.06;powerLight.material=stage>=2?materials.cyan:materials.orange;constructionLights.forEach(m=>m.material=stage>=2?materials.cyan:materials.dark);serviceCrate.visible=stage===0;
    drawMap($('mars-minimap'),true);if($('mars-map-dialog').open)drawMap($('mars-map'),false);
  }
  function update(dt){
    if(!active||$('mars-map-dialog').open)return;time+=dt;saveTimer+=dt;hudTimer+=dt;
    const throttle=(keys.has('KeyW')||keys.has('ArrowUp')||touch.has('forward')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')||touch.has('reverse')?1:0);
    const steer=(keys.has('KeyA')||keys.has('ArrowLeft')||touch.has('left')?1:0)-(keys.has('KeyD')||keys.has('ArrowRight')||touch.has('right')?1:0);
    roverState=stepRover(roverState,{throttle,steer,brake:keys.has('Space')||touch.has('brake')},dt);placeRover(dt);
    if(stage>=2)craneArm.rotation.y=Math.sin(time*.07)*.13;
    beacons.forEach(({ring,site})=>{ring.scale.setScalar(1+Math.sin(time*2)*.05);ring.material=site.id===targetId?materials.warm:materials.cyan;});
    messageTimer-=dt;if(messageTimer<=0)$('mars-radio').hidden=true;
    if(saveTimer>3){save();saveTimer=0;}if(hudTimer>.1){refreshHud();hudTimer=0;}
    createMotor();if(motorGain&&localAudio){motorGain.gain.setTargetAtTime(!getMuted()?Math.min(.025,Math.abs(roverState.speed)*.002):0,localAudio.currentTime,.1);motor.frequency.setTargetAtTime(35+Math.abs(roverState.speed)*5,localAudio.currentTime,.1);}
  }
  function render(dt){if(!active)return;updateCamera(dt);renderer.render(scene,camera);}
  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();refreshHud();}
  function enter(){active=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMappingExposure=1.05;$('mars-ui').hidden=false;document.body.classList.add('on-mars');placeRover(0);updateCamera(0,true);for(let i=0;i<dustCount;i++)dustPositions.set([roverState.x,rover.position.y,roverState.z],i*3);refreshHud();radio(stage===0?'MARA / Welcome to Hearth. The east solar bank needs a controller. There’s one waiting at the workshop.':'HEARTH / Welcome back. Your rover and field log are right where you left them.');save();}
  function exit(){
    save();active=false;clearInput();if($('mars-map-dialog').open)$('mars-map-dialog').close();$('mars-map-dialog').removeEventListener('cancel',cancelMap);$('mars-ui').hidden=true;document.body.classList.remove('on-mars');renderer.shadowMap.enabled=false;renderer.toneMappingExposure=1.25;
    for(const id of ['mars-map-close','mars-open-map','mars-reset','mars-view','mars-interact'])$(id).onclick=null;waypointList.replaceChildren();
    for(const remove of cleanup)remove();if(localAudio){motor?.stop();localAudio.close().catch(()=>{});}
    const geometries=new Set(),mats=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list){if(!m)continue;mats.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of mats)m.dispose();sunlight.shadow.map?.dispose();
  }
  function status(){return {scene:'mars',site:'Hearth Crater',rover:{x:Math.round(roverState.x),z:Math.round(roverState.z),speed:Math.round(roverState.speed*3.6)},mission:missionForStage(stage).title,stage,cargo:stage===1?'array-controller':null,power:stage>=2?78:42,target:targetId,renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}
  return {enter,exit,update,render,resize,keydown,keyup,clearInput,reset,openMap,status,get blocked(){return $('mars-map-dialog').open;}};
}
