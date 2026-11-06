import {AU,SYSTEM_RADIUS,fuelRange} from './simulation.js';

// Linear world-space maps: zoom changes the view, never the underlying ratios.
export function makeNavigation({planets,stations,ship,getFuel,getRoute,getSelected,getLeg,onSelect}) {
  const canvas=document.getElementById('system-map'),mini=document.getElementById('minimap');
  const view={x:0,z:0,extent:SYSTEM_RADIUS*1.05},list=document.getElementById('planet-list');
  const stationList=document.getElementById('station-list'),search=document.getElementById('station-search');
  const rows=new Map();let drag=null,moved=false,visitedIds=new Set(),dockedIds=new Set();
  for(const p of planets){
    const row=document.createElement('button');row.className='planet-row';row.dataset.id=p.id;
    row.innerHTML=`<i style="background:${p.color}"></i><span><strong>${p.name}</strong><small>${p.au.toFixed(3)} AU FROM SUN</small></span><b>↗</b>`;
    row.onclick=()=>onSelect('planet',p.id);list.appendChild(row);rows.set(p.id,row);
  }
  function refreshList(visited=visitedIds,docked=dockedIds) {
    visitedIds=visited;dockedIds=docked;
    const selected=getSelected();
    for(const p of planets){const row=rows.get(p.id);row.classList.toggle('selected',selected.id===p.id);row.setAttribute('aria-pressed',String(selected.id===p.id));row.querySelector('b').textContent=visited.has(p.id)?'✓':'↗';}
    const query=search.value.trim().toLowerCase(),leg=getLeg();
    const visible=stations.filter(c=>!query||`${c.name} ${c.type}`.toLowerCase().includes(query))
      .map(c=>({c,d:c.center.distanceTo(ship.position)})).sort((a,b)=>a.d-b.d).slice(0,query?24:8);
    stationList.replaceChildren();
    for(const {c,d} of visible){
      const row=document.createElement('button');row.className='planet-row waypoint-row';row.classList.toggle('selected',selected.id===c.id);row.setAttribute('aria-pressed',String(selected.id===c.id));
      row.innerHTML=`<i>◇</i><span><strong>${c.name}</strong><small>${(d/AU).toFixed(2)} AU · ${leg.id===c.id?'NEXT STOP':docked.has(c.id)?'VISITED':'REFUEL / REPAIR'}</small></span><b>↗</b>`;
      row.onclick=()=>onSelect('checkpoint',c.id);stationList.appendChild(row);
    }
    document.getElementById('depot-count').textContent=`${stations.length} orbital fuel depots · nearest first`;
    if(!visible.length){const empty=document.createElement('p');empty.className='empty-search';empty.textContent='No depots match this name.';stationList.appendChild(empty);}
  }
  search.addEventListener('input',()=>refreshList());
  function fit(mode) {
    if(mode==='system'){view.x=0;view.z=0;view.extent=SYSTEM_RADIUS*1.05;}
    if(mode==='inner'){view.x=0;view.z=0;view.extent=4*AU;}
    if(mode==='ship'){view.x=ship.position.x;view.z=ship.position.z;view.extent=4*AU;}
    draw();
  }
  for(const mode of ['system','inner','ship'])document.getElementById(`map-${mode}`).onclick=()=>fit(mode);
  function zoom(factor,x=canvas.clientWidth/2,y=canvas.clientHeight/2) {
    const m=canvas.mapTransform;if(!m)return;
    const wx=(x-m.cx)/m.s,wz=(y-m.cy)/m.s;
    view.extent=Math.max(450,Math.min(SYSTEM_RADIUS*1.6,view.extent*factor));
    const scale=Math.min(m.w,m.h)/(view.extent*2);
    view.x=wx-(x-m.w/2)/scale;view.z=wz-(y-m.h/2)/scale;draw();
  }
  document.getElementById('map-zoom-in').onclick=()=>zoom(.65);
  document.getElementById('map-zoom-out').onclick=()=>zoom(1/.65);
  canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(e.deltaY>0?1.2:1/1.2,e.clientX-r.left,e.clientY-r.top);},{passive:false});
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,originX:view.x,originZ:view.z};moved=false;});
  canvas.addEventListener('pointermove',e=>{
    if(!drag||!canvas.mapTransform)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)moved=true;
    if(moved){view.x=drag.originX-dx/canvas.mapTransform.s;view.z=drag.originZ-dy/canvas.mapTransform.s;draw();}
  });
  canvas.addEventListener('pointerup',e=>{
    if(!drag)return;drag=null;
    if(moved)return;
    const r=canvas.getBoundingClientRect(),m=canvas.mapTransform;if(!m)return;
    const x=e.clientX-r.left,y=e.clientY-r.top;
    const candidates=[...planets.map(p=>({type:'planet',id:p.id,pos:p.root.position})),...stations.map(c=>({type:'checkpoint',id:c.id,pos:c.center}))]
      .map(t=>({...t,d:Math.hypot(m.cx+t.pos.x*m.s-x,m.cy+t.pos.z*m.s-y)})).sort((a,b)=>a.d-b.d);
    if(candidates[0]?.d<16)onSelect(candidates[0].type,candidates[0].id);
  });
  canvas.addEventListener('pointercancel',()=>{drag=null;});
  function drawOne(target,isMini) {
    const rect=target.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const ratio=Math.min(devicePixelRatio,2),w=rect.width,h=rect.height;
    if(target.width!==Math.round(w*ratio)||target.height!==Math.round(h*ratio)){target.width=Math.round(w*ratio);target.height=Math.round(h*ratio);}
    const ctx=target.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
    const extent=isMini?4*AU:view.extent,s=Math.min(w,h)/(extent*2);
    const cx=w/2-(isMini?ship.position.x:view.x)*s,cy=h/2-(isMini?ship.position.z:view.z)*s;
    const xy=v=>({x:cx+v.x*s,y:cy+v.z*s});
    ctx.strokeStyle='#254056';ctx.lineWidth=.7;
    for(const p of planets){ctx.beginPath();ctx.arc(cx,cy,p.orbit*s,0,Math.PI*2);ctx.stroke();}
    // Available range is a linear-radius circle, not a promise of a safe path through the Sun.
    const here=xy(ship.position);ctx.strokeStyle='#b9d58455';ctx.fillStyle='#c6ef6a06';ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(here.x,here.y,fuelRange(getFuel())*s,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ffcb77';ctx.beginPath();ctx.arc(cx,cy,isMini?2:4,0,Math.PI*2);ctx.fill();
    const route=getRoute(),selected=getSelected(),leg=getLeg();
    const routeIds=new Set(route?.stops.map(c=>c.id));
    for(const c of stations){
      const p=xy(c.center);if(p.x<0||p.x>w||p.y<0||p.y>h)continue;
      const active=leg.id===c.id||selected.id===c.id;const r=active?5:routeIds.has(c.id)?3:1.7;
      ctx.strokeStyle=active?'#e1ff99':routeIds.has(c.id)?'#97dce7':'#59746c';ctx.beginPath();ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x+r,p.y);ctx.lineTo(p.x,p.y+r);ctx.lineTo(p.x-r,p.y);ctx.closePath();ctx.stroke();
      if(active&&!isMini){ctx.fillStyle='#d7efac';ctx.font='10px Arial';ctx.fillText(c.name,p.x+9,p.y-8);}
    }
    const dest=selected.type==='planet'?planets.find(p=>p.id===selected.id)?.root.position:stations.find(c=>c.id===selected.id)?.center;
    if(dest){
      const points=[ship.position,...(route?.stops.map(c=>c.center)||[]),dest];
      ctx.strokeStyle=route?'#b8eb86aa':'#efaa7a99';ctx.setLineDash([4,5]);ctx.beginPath();
      points.forEach((p,i)=>{const q=xy(p);if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});ctx.stroke();ctx.setLineDash([]);
    }
    const labels=[];
    for(const p of planets){
      const q=xy(p.root.position);if(q.x<-10||q.x>w+10||q.y<-10||q.y>h+10)continue;
      const active=selected.id===p.id,r=isMini?3:active?5:4;
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fill();
      if(active){ctx.strokeStyle='#e1ff99';ctx.beginPath();ctx.arc(q.x,q.y,r+4,0,Math.PI*2);ctx.stroke();}
      if(!isMini&&(active||!labels.some(l=>Math.hypot(l.x-q.x,l.y-q.y)<38))){ctx.fillStyle=active?'#e8ffbd':'#a5bcd0';ctx.font='10px Arial';ctx.fillText(p.name.toUpperCase(),q.x+11,q.y-8);labels.push(q);}
    }
    // Forward vector transformed by the ship quaternion, without a Three.js dependency.
    const q=ship.quaternion;
    const dx=-2*(q.x*q.z+q.w*q.y),dz=-(1-2*(q.x*q.x+q.y*q.y));
    ctx.save();ctx.translate(here.x,here.y);ctx.rotate(Math.atan2(dz,dx)+Math.PI/2);ctx.fillStyle='#e5ff8f';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(0,3);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
    ctx.font='9px Arial';ctx.fillStyle='#7d98b1';ctx.fillText(isMini?'LOCAL SPACE · 8 AU ACROSS':`${(extent*2/AU).toFixed(1)} AU ACROSS · SCROLL TO ZOOM / DRAG TO PAN`,12,isMini?13:20);
    if(!isMini)target.mapTransform={s,cx,cy,w,h};
  }
  function draw(){
    drawOne(mini,true);
    if(document.getElementById('map-dialog').open){
      drawOne(canvas,false);
      const selected=getSelected(),route=getRoute();
      const target=selected.type==='planet'?planets.find(p=>p.id===selected.id):stations.find(c=>c.id===selected.id);
      document.getElementById('map-route-summary').textContent=route
        ? `${target.name.toUpperCase()} · ${(route.distance/AU).toFixed(1)} AU ROUTE · ${route.stops.length} FUEL STOPS`
        : `${target.name.toUpperCase()} · INSUFFICIENT FUEL FOR A SAFE ROUTE`;
    }
  }
  return {draw,refreshList,fit};
}
