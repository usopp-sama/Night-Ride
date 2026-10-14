import * as T from 'three';
import { instanceNature } from './models';
import type { ModelKit, Placement } from './models';

export class DriveScene {
  readonly renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.PerspectiveCamera(58, 1, 0.1, 1200);
  private car = new T.Group();
  private wheels: T.Group[] = [];
  private position = new T.Vector3();
  private orientation = new T.Quaternion();
  private previousQ = new T.Quaternion();
  private target = new T.Vector3();
  private aim = new T.Vector3();
  private cameraPosition = new T.Vector3();
  private forward = new T.Vector3();
  private wheelSpin = 0;
  private firstFrame = true;
  private observer: ResizeObserver;
  constructor(canvas: HTMLCanvasElement, private track: Float32Array, private kit: ModelKit) {
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.scene.background = new T.Color('#647b8e');
    this.scene.fog = new T.FogExp2('#647b8e', 0.0038);
    this.scene.add(new T.HemisphereLight('#d1dfea', '#3c4933', 2.4));
    const moonlight = new T.DirectionalLight('#fff0ce', 2.5); moonlight.position.set(-80, 100, 45); this.scene.add(moonlight);
    this.makeEnvironment(); this.makeCar();
    for (const child of this.car.children) if (child instanceof T.Mesh || child instanceof T.Group) child.visible = false;
    const model = kit.car.clone(true); model.position.y = -0.77; this.car.add(model);
    this.scene.add(this.car);
    this.observer = new ResizeObserver(() => this.resize(canvas)); this.observer.observe(canvas);
    this.resize(canvas);
  }
  private resize(canvas: HTMLCanvasElement) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / Math.max(1, h); this.camera.updateProjectionMatrix();
  }
  private material(color: string, roughness = 0.85) { return new T.MeshStandardMaterial({ color, roughness }); }
  private ribbon(left: number, right: number, material: T.Material, surface = -1, lift = 0, dashed = false) {
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i < this.track.length / 8 - 1; ++i) {
      const a = i * 8, b = (i + 1) * 8;
      if (surface >= 0 && this.track[a + 6] !== surface) continue;
      if (dashed && Math.floor(this.track[a + 5]! / 6) % 2 !== 0) continue;
      const base = vertices.length / 3;
      for (const j of [a, b]) for (const offset of [left, right]) {
        vertices.push(this.track[j]! + this.track[j + 3]! * offset, this.track[j + 1]! + lift, this.track[j + 2]! + this.track[j + 4]! * offset);
      }
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
    const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new T.Mesh(geometry, material); this.scene.add(mesh);
  }
  private makeEnvironment() {
    const sky = new T.Mesh(new T.SphereGeometry(950, 24, 16), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false,
      uniforms: { zenith: { value: new T.Color('#20384f') }, horizon: { value: new T.Color('#647b8e') } },
      vertexShader: 'varying vec3 skyDirection; void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 zenith;uniform vec3 horizon;varying vec3 skyDirection;void main(){float h=pow(max(normalize(skyDirection).y,0.0),0.45);gl_FragColor=vec4(mix(horizon,zenith,h),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    }));
    this.scene.add(sky);
    // This is an authored proving ground. All drivable elevations and road samples come from C++.
    this.ribbon(-28, 28, this.material('#45543c'));
    this.ribbon(-8, 8, this.material('#6a6957'), -1, 0.012);
    this.ribbon(-6, 6, this.material('#343e43'), 0, 0.025);
    this.ribbon(-6, 6, this.material('#897b62'), 1, 0.025);
    const paint = this.material('#d8caa0');
    this.ribbon(-0.07, 0.07, paint, 0, 0.04, true);
    this.ribbon(-5.7, -5.6, paint, 0, 0.04); this.ribbon(5.6, 5.7, paint, 0, 0.04);
    const ground = new T.Mesh(new T.PlaneGeometry(2200, 2200), this.material('#394b3d')); ground.rotation.x = -Math.PI / 2; ground.position.y = -2.5; this.scene.add(ground);
    const water = new T.Mesh(new T.PlaneGeometry(62, 210), new T.MeshStandardMaterial({ color: '#477180', metalness: 0.5, roughness: 0.25 }));
    water.rotation.x = -Math.PI / 2; water.position.y = -0.45; this.scene.add(water);
    // Low polygon silhouettes and instanced trees are visual only, outside both guardrails.
    const treeCount = 180, crowns = new T.InstancedMesh(new T.ConeGeometry(2.9, 11, 6), this.material('#243e36'), treeCount);
    const trunks = new T.InstancedMesh(new T.CylinderGeometry(0.18, 0.26, 5, 5), this.material('#49483b'), treeCount);
    const dummy = new T.Object3D();
    for (let i = 0; i < treeCount; ++i) {
      const j = (i * 31 % (this.track.length / 8 - 1)) * 8;
      const offset = 17 + i % 5 * 5, size = 0.65 + i % 7 * 0.11;
      const x = this.track[j]! + this.track[j + 3]! * offset, z = this.track[j + 2]! + this.track[j + 4]! * offset, y = this.track[j + 1]!;
      dummy.position.set(x, y + 5 * size, z); dummy.scale.setScalar(size); dummy.rotation.y = i * 2.3; dummy.updateMatrix(); crowns.setMatrixAt(i, dummy.matrix);
      dummy.position.y = y + 1.5 * size; dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    }
    crowns.geometry.dispose(); trunks.geometry.dispose();
    const placements: Placement[] = [];
    for (let i = 0; i < 420; ++i) {
      const j = (i * 31 % (this.track.length / 8 - 1)) * 8;
      const offset = 14 + i % 7 * 3.5;
      placements.push([i % 4, this.track[j]! + this.track[j + 3]! * offset, this.track[j + 1]!, this.track[j + 2]! + this.track[j + 4]! * offset, 0.7 + i % 5 * 0.12, i * 2.3]);
    }
    instanceNature(this.scene, this.kit, placements);
    const mountainMaterial = this.material('#475764');
    for (let i = 0; i < 14; ++i) {
      const a = i / 14 * Math.PI * 2, mountain = new T.Mesh(new T.ConeGeometry(95 + i % 3 * 22, 95 + i % 4 * 30, 5), mountainMaterial);
      mountain.position.set(Math.sin(a) * 430, 22, Math.cos(a) * 430); mountain.rotation.y = i; this.scene.add(mountain);
    }
    const moon = new T.Mesh(new T.SphereGeometry(9, 20, 12), new T.MeshBasicMaterial({ color: '#f5e8c3', fog: false }));
    moon.position.set(-235, 175, 400); this.scene.add(moon);
    // Continuous rails use the very same 9 m boundary as the native solver.
    const railCount = (this.track.length / 8 - 1) * 2;
    const rails = new T.InstancedMesh(new T.BoxGeometry(0.16, 0.25, 1), this.material('#a6ada7', 0.45), railCount);
    let n = 0;
    for (let i = 0; i < this.track.length / 8 - 1; ++i) for (const offset of [-9, 9]) {
      const a = i * 8, b = (i + 1) * 8;
      const ax = this.track[a]! + this.track[a + 3]! * offset, az = this.track[a + 2]! + this.track[a + 4]! * offset;
      const bx = this.track[b]! + this.track[b + 3]! * offset, bz = this.track[b + 2]! + this.track[b + 4]! * offset;
      const dy = this.track[b + 1]! - this.track[a + 1]!;
      dummy.position.set((ax + bx) / 2, (this.track[a + 1]! + this.track[b + 1]!) / 2 + 0.7, (az + bz) / 2);
      dummy.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(bx - ax, dy, bz - az).normalize());
      dummy.scale.set(1, 1, Math.hypot(bx - ax, bz - az, dy) + 0.04); dummy.updateMatrix(); rails.setMatrixAt(n++, dummy.matrix);
    }
    this.scene.add(rails);
    const posts: T.Matrix4[] = [], reflectors: T.Matrix4[] = [];
    for (let i = 0; i < this.track.length / 8 - 1; i += 10) for (const side of [-1, 1]) {
      const j = i * 8;
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.position.set(this.track[j]! + this.track[j + 3]! * side * 8.9, this.track[j + 1]! + 0.38, this.track[j + 2]! + this.track[j + 4]! * side * 8.9);
      dummy.updateMatrix(); posts.push(dummy.matrix.clone()); dummy.position.y += 0.43; dummy.updateMatrix(); reflectors.push(dummy.matrix.clone());
    }
    const postMesh = new T.InstancedMesh(new T.BoxGeometry(0.13, 0.8, 0.13), this.material('#535e57'), posts.length);
    const reflectMesh = new T.InstancedMesh(new T.BoxGeometry(0.2, 0.12, 0.2), new T.MeshBasicMaterial({ color: '#f2d4a0' }), posts.length);
    posts.forEach((m, i) => postMesh.setMatrixAt(i, m)); reflectors.forEach((m, i) => reflectMesh.setMatrixAt(i, m)); this.scene.add(postMesh, reflectMesh);
    // Start stripe and small roadside hut: authored scenery, no gameplay interactions yet.
    const stripe = new T.Mesh(new T.BoxGeometry(11.2, 0.015, 0.35), paint); stripe.position.set(55, 0.05, -75); this.scene.add(stripe);
    const hut = new T.Mesh(new T.BoxGeometry(6, 3.5, 5), this.material('#746c56')); hut.position.set(72, 1.75, -84); this.scene.add(hut);
    const roof = new T.Mesh(new T.ConeGeometry(5, 2, 4), this.material('#303d3e')); roof.rotation.y = Math.PI / 4; roof.position.set(72, 4.3, -84); this.scene.add(roof);
    const window = new T.Mesh(new T.BoxGeometry(0.03, 1.5, 2), new T.MeshBasicMaterial({ color: '#efc890' })); window.position.set(68.98, 1.9, -84); this.scene.add(window);
  }
  private makeCar() {
    const paint = this.material('#d9c995', 0.45), trim = this.material('#293336', 0.6), glass = this.material('#55727a', 0.18);
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: T.Material) => {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); this.car.add(mesh); return mesh;
    };
    box(1.8, 0.52, 3.8, 0, 0.05, 0, paint); box(1.55, 0.5, 1.85, 0, 0.54, -0.25, glass); box(1.6, 0.08, 1.9, 0, 0.83, -0.25, paint);
    box(1.83, 0.15, 0.12, 0, -0.08, 1.94, trim); box(1.83, 0.15, 0.12, 0, -0.08, -1.94, trim);
    box(0.08, 0.5, 1.88, -0.79, 0.54, -0.25, paint); box(0.08, 0.5, 1.88, 0.79, 0.54, -0.25, paint);
    for (const x of [-0.65, 0.65]) {
      box(0.38, 0.15, 0.04, x, 0.12, 1.93, new T.MeshBasicMaterial({ color: '#fff1bc' }));
      box(0.36, 0.15, 0.04, x, 0.12, -1.93, new T.MeshBasicMaterial({ color: '#ef6946' }));
      const light = new T.SpotLight('#ffedbd', 50, 75, 0.4, 0.65, 1); light.position.set(x, 0.15, 1.7);
      light.target.position.set(x, -0.6, 30); this.car.add(light, light.target);
    }
    const tire = new T.CylinderGeometry(0.32, 0.32, 0.24, 12); tire.rotateZ(Math.PI / 2);
    for (let i = 0; i < 4; ++i) {
      const pivot = new T.Group(); const wheel = new T.Mesh(tire, trim); pivot.add(wheel);
      const hubGeo = new T.CylinderGeometry(0.16, 0.16, 0.245, 8); hubGeo.rotateZ(Math.PI / 2);
      pivot.add(new T.Mesh(hubGeo, this.material('#a6aaa0', 0.4))); this.wheels.push(pivot); this.car.add(pivot);
    }
    // Soft contact shadow without a full-scene shadow pass.
    const shadow = new T.Mesh(new T.CircleGeometry(1, 32), new T.MeshBasicMaterial({ color: '#0b1517', transparent: true, opacity: 0.3, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.scale.set(1.25, 2.25, 1); shadow.position.y = -0.72; this.car.add(shadow);
  }
  snapCamera() { this.firstFrame = true; }
  render(previous: Float32Array, current: Float32Array, alpha: number, elapsed: number) {
    this.position.set(previous[2]!, previous[3]!, previous[4]!).lerp(this.target.set(current[2]!, current[3]!, current[4]!), alpha);
    this.previousQ.set(previous[5]!, previous[6]!, previous[7]!, previous[8]!);
    this.orientation.set(current[5]!, current[6]!, current[7]!, current[8]!); this.previousQ.slerp(this.orientation, alpha);
    this.car.position.copy(this.position); this.car.quaternion.copy(this.previousQ);
    this.wheelSpin += current[15]! * elapsed / 0.32;
    for (let i = 0; i < 4; ++i) {
      const wheel = this.wheels[i]!; wheel.position.set(i % 2 === 0 ? -0.88 : 0.88, -current[28 + i]!, i < 2 ? 1.3 : -1.3);
      wheel.rotation.set(0, i < 2 ? current[18]! : 0, 0); for (const part of wheel.children) part.rotation.x = this.wheelSpin;
    }
    // Horizontal heading prevents suspension pitch/roll from making the camera seasick.
    this.forward.set(0, 0, 1).applyQuaternion(this.previousQ); this.forward.y = 0; this.forward.normalize();
    this.cameraPosition.copy(this.position).addScaledVector(this.forward, -9); this.cameraPosition.y += 4.5;
    this.target.copy(this.position).addScaledVector(this.forward, 10); this.target.y += 0.7;
    const blend = this.firstFrame ? 1 : 1 - Math.exp(-6 * Math.min(elapsed, 0.1));
    this.camera.position.lerp(this.cameraPosition, blend); this.aim.lerp(this.target, blend); this.camera.lookAt(this.aim); this.firstFrame = false;
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.observer.disconnect(); this.scene.traverse(object => {
      if (object instanceof T.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(m => m.dispose()); }
    }); this.renderer.dispose();
  }
}
