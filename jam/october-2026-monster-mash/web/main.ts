import './style.css';
import { loadCore } from './core';
import type { Envelope, Manifest } from './core';

const el = <T extends HTMLElement>(id: string) => {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing element: ${id}`);
  return result as T;
};
const seedInput = el<HTMLInputElement>('seed');
const svg = document.querySelector<SVGSVGElement>('#map')!;
const ns = 'http://www.w3.org/2000/svg';
function element(name: string, attrs: Record<string,string | number>, text?: string) {
  const node = document.createElementNS(ns,name);
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}
const palettes: Record<string,string> = { 'coastal-indigo': 'The Indigo Coast', 'pine-emerald': 'The Pine Country', 'moor-amber': 'The Amber Moor' };

function drawMap(world: Manifest) {
  svg.replaceChildren();
  svg.setAttribute('aria-label', `Schematic route map for seed ${world.seed}. ${world.nodes.length} nodes and ${world.edges.length} roads.`);
  // Layout is a schematic of authoritative C++ coordinates. No world generation occurs here.
  const maxZ = Math.max(...world.nodes.map(n=>n.zM));
  const maxX = Math.max(1000,...world.nodes.map(n=>Math.abs(n.xM)));
  const position = (id: string): [number,number] => {
    const n = world.nodes.find(n=>n.id===id);
    if (!n) throw new Error(`Unknown node ${id}`);
    return [85 + n.zM/maxZ*790, 270 + n.xM/maxX*153];
  };
  const grid = element('g', { class: 'map-grid' });
  for (let x=25;x<960;x+=40) for (let y=25;y<540;y+=40) grid.append(element('circle',{cx:x,cy:y,r:0.7}));
  svg.append(grid);
  // Decorative contour lines belong to the atlas paper, not generated terrain.
  const contours = element('g',{class:'contours'});
  for (let i=0;i<8;i++) contours.append(element('path',{d:`M ${-120+i*24} 540 Q ${80+i*40} ${270-i*9} ${300+i*32} ${440+i*16} T 1100 ${390+i*22}`}));
  svg.append(contours);
  for (const e of [...world.edges].sort((a,b)=>Number(a.mainRoute)-Number(b.mainRoute))) {
    const [x1,y1]=position(e.from),[x2,y2]=position(e.to);
    const path = `M ${x1} ${y1} L ${x2} ${y2}`;
    if (e.mainRoute) svg.append(element('path',{d:path,class:'road-halo'}));
    const line = element('path',{d:path,class:e.mainRoute?'road':'detour'});
    line.append(element('title',{},`${e.surface}: ${e.lengthM} m`)); svg.append(line);
  }
  for (const n of world.nodes) {
    const [x,y]=position(n.id);
    const group = element('g',{'data-node':n.id,class:`map-node ${n.role}`});
    const notable = n.role !== 'junction' && n.role !== 'approach';
    if (notable) group.append(element('circle',{cx:x,cy:y,r:14,class:'node-ring'}));
    if (n.role==='service') group.append(element('rect',{x:x-5,y:y-5,width:10,height:10,rx:2,class:'node-core'}));
    else group.append(element('circle',{cx:x,cy:y,r:notable?4.5:3,class:'node-core'}));
    if (notable) {
      const above = n.xM < 0 || n.role==='start' || n.role==='destination';
      const ly=y+(above?-30:35);
      group.append(element('text',{x,y:ly,'text-anchor':'middle',class:'node-label'},n.label));
      group.append(element('text',{x,y:ly+14,'text-anchor':'middle',class:'node-type'},n.role.toUpperCase()));
    }
    group.append(element('title',{},`${n.label} · ${n.role} · (${n.xM}, ${n.zM}) m`));
    svg.append(group);
  }
}

function render(envelope: Envelope, elapsed: number) {
  const w = envelope.manifest;
  drawMap(w);
  seedInput.value=w.seed;
  el<HTMLAnchorElement>('world-link').href=`./world.html?seed=${encodeURIComponent(w.seed)}`;
  document.body.dataset.palette=w.palette;
  el('region-title').textContent=palettes[w.palette] ?? w.palette;
  el('weather').textContent=w.weather.replace('-',' ');
  el('distance').textContent=`${(w.mainRouteLengthM/1000).toFixed(2)} km`;
  el('places').textContent=String(w.nodes.filter(n=>n.role==='landmark').length).padStart(2,'0');
  el('hash').textContent=envelope.manifestHash;
  el('version').textContent=`v${w.generatorVersion} · attempt ${w.attempt+1}`;
  el('validation').textContent='Connected';
  el('timing').textContent=`${elapsed.toFixed(2)} ms · generation + validation + bridge`;
  el('graph-status').textContent=`${w.nodes.length} places / ${w.edges.length} roads`;
  el('manifest').textContent=JSON.stringify(envelope,null,2);
  el('status').textContent=`“${w.seed}” is ready. Graph checks passed. Try the car on the authored test loop; driving through this seeded region comes next.`;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-seed]')) button.classList.toggle('selected',button.dataset.seed===w.seed);
  document.documentElement.dataset.ready='true';
}

async function boot() {
  const generate = await loadCore();
  const run = (seed: string) => {
    try {
      const t=performance.now(); const world=generate(seed); const elapsed=performance.now()-t;
      render(world,elapsed); seedInput.removeAttribute('aria-invalid');
    } catch (error) {
      el('status').textContent=error instanceof Error?error.message:String(error);
      seedInput.setAttribute('aria-invalid','true'); seedInput.focus();
    }
  };
  el<HTMLFormElement>('seed-form').addEventListener('submit',event=>{event.preventDefault(); run(seedInput.value);});
  el('random').addEventListener('click',()=>{
    const value=crypto.getRandomValues(new Uint32Array(1))[0]!;
    run(`night-${value.toString(16).padStart(8,'0')}`);
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-seed]')) button.addEventListener('click',()=>run(button.dataset.seed!));
  for (const button of document.querySelectorAll<HTMLButtonElement>('button')) button.disabled=false;
  run(seedInput.value);
}
boot().catch(error=>{
  el('status').textContent=`The world generator could not start: ${error instanceof Error?error.message:String(error)}. Run npm run build and reload.`;
  el('validation').textContent='Unavailable';
});

