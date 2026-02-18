// Component inspired by Kevin Levron:
// https://x.com/soju22/status/1858925191671271801
// Adapted from React Bits

import { useRef, useEffect } from 'react';
import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SRGBColorSpace,
  MathUtils,
  Vector2,
  Vector3,
  MeshPhysicalMaterial,
  ShaderChunk,
  Color,
  Object3D,
  InstancedMesh,
  PMREMGenerator,
  SphereGeometry,
  AmbientLight,
  PointLight,
  ACESFilmicToneMapping,
  Raycaster,
  Plane
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ── ThreeApp ── */
class ThreeApp {
  #config: any;
  canvas: any;
  camera: any;
  cameraMinAspect: any;
  cameraMaxAspect: any;
  cameraFov: any;
  maxPixelRatio: any;
  minPixelRatio: any;
  scene: any;
  renderer: any;
  #postprocessing: any;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render: any;
  onBeforeRender: any = () => {};
  onAfterRender: any = () => {};
  onAfterResize: any = () => {};
  #isVisible = false;
  #isAnimating = false;
  isDisposed = false;
  #intersectionObs: any;
  #resizeObs: any;
  #resizeTimeout: any;
  #clock = new Clock();
  #time = { elapsed: 0, delta: 0 };
  #rafId: any;

  constructor(config: any) {
    this.#config = { ...config };
    this.camera = new PerspectiveCamera();
    this.cameraFov = this.camera.fov;
    this.scene = new Scene();
    this.render = () => this.renderer.render(this.scene, this.camera);

    if (this.#config.canvas) {
      this.canvas = this.#config.canvas;
    } else if (this.#config.id) {
      this.canvas = document.getElementById(this.#config.id);
    }
    this.canvas.style.display = 'block';

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      powerPreference: 'high-performance',
      ...(this.#config.rendererOptions ?? {})
    });
    this.renderer.outputColorSpace = SRGBColorSpace;

    this.resize();
    this.#setupListeners();
  }

  #setupListeners() {
    if (!(this.#config.size instanceof Object)) {
      window.addEventListener('resize', this.#onResize);
      if (this.#config.size === 'parent' && this.canvas.parentNode) {
        this.#resizeObs = new ResizeObserver(this.#onResize);
        this.#resizeObs.observe(this.canvas.parentNode);
      }
    }
    this.#intersectionObs = new IntersectionObserver(
      (entries) => {
        this.#isVisible = entries[0].isIntersecting;
        this.#isVisible ? this.#startLoop() : this.#stopLoop();
      },
      { root: null, rootMargin: '0px', threshold: 0 }
    );
    this.#intersectionObs.observe(this.canvas);
    document.addEventListener('visibilitychange', this.#onVisibility);
  }

  #removeListeners() {
    window.removeEventListener('resize', this.#onResize);
    this.#resizeObs?.disconnect();
    this.#intersectionObs?.disconnect();
    document.removeEventListener('visibilitychange', this.#onVisibility);
  }

  #onVisibility = () => {
    if (this.#isVisible) {
      document.hidden ? this.#stopLoop() : this.#startLoop();
    }
  };

  #onResize = () => {
    if (this.#resizeTimeout) clearTimeout(this.#resizeTimeout);
    this.#resizeTimeout = setTimeout(() => this.resize(), 100);
  };

  resize() {
    let w, h;
    if (this.#config.size instanceof Object) {
      w = this.#config.size.width;
      h = this.#config.size.height;
    } else if (this.#config.size === 'parent' && this.canvas.parentNode) {
      w = this.canvas.parentNode.offsetWidth;
      h = this.canvas.parentNode.offsetHeight;
    } else {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    this.size.width = w;
    this.size.height = h;
    this.size.ratio = w / h;

    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.#adjustFov(this.cameraMinAspect);
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.#adjustFov(this.cameraMaxAspect);
      } else {
        this.camera.fov = this.cameraFov;
      }
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();

    this.renderer.setSize(this.size.width, this.size.height);
    this.#postprocessing?.setSize(this.size.width, this.size.height);
    let pr = window.devicePixelRatio;
    if (this.maxPixelRatio && pr > this.maxPixelRatio) pr = this.maxPixelRatio;
    else if (this.minPixelRatio && pr < this.minPixelRatio) pr = this.minPixelRatio;
    this.renderer.setPixelRatio(pr);
    this.size.pixelRatio = pr;

    this.onAfterResize(this.size);
  }

  #adjustFov(targetAspect: number) {
    const t = Math.tan(MathUtils.degToRad(this.cameraFov / 2)) / (this.camera.aspect / targetAspect);
    this.camera.fov = 2 * MathUtils.radToDeg(Math.atan(t));
  }

  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fovRad = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    }
  }

  #startLoop() {
    if (this.#isAnimating) return;
    this.#isAnimating = true;
    this.#clock.start();
    const animate = () => {
      this.#rafId = requestAnimationFrame(animate);
      this.#time.delta = this.#clock.getDelta();
      this.#time.elapsed += this.#time.delta;
      this.onBeforeRender(this.#time);
      this.render();
      this.onAfterRender(this.#time);
    };
    animate();
  }

  #stopLoop() {
    if (this.#isAnimating) {
      cancelAnimationFrame(this.#rafId);
      this.#isAnimating = false;
      this.#clock.stop();
    }
  }

  clear() {
    this.scene.traverse((obj: any) => {
      if (obj.isMesh && typeof obj.material === 'object' && obj.material !== null) {
        Object.keys(obj.material).forEach((key: string) => {
          const val = obj.material[key];
          if (val !== null && typeof val === 'object' && typeof val.dispose === 'function') val.dispose();
        });
        obj.material.dispose();
        obj.geometry.dispose();
      }
    });
    this.scene.clear();
  }

  dispose() {
    this.#removeListeners();
    this.#stopLoop();
    this.clear();
    this.#postprocessing?.dispose();
    this.renderer.dispose();
    this.isDisposed = true;
  }
}

/* ── Pointer ── */
const pointerMap = new Map<HTMLElement, any>();
const pointerPos = new Vector2();
let pointerListening = false;

function setupPointer(config: any) {
  const state = {
    position: new Vector2(),
    nPosition: new Vector2(),
    hover: false,
    touching: false,
    onEnter() {},
    onMove() {},
    onClick() {},
    onLeave() {},
    dispose: () => {},
    ...config
  };

  const el = config.domElement;
  if (!pointerMap.has(el)) {
    pointerMap.set(el, state);
    if (!pointerListening) {
      document.body.addEventListener('pointermove', onPointerMove);
      document.body.addEventListener('pointerleave', onPointerLeave);
      document.body.addEventListener('click', onPointerClick);
      document.body.addEventListener('touchstart', onTouchStart, { passive: false });
      document.body.addEventListener('touchmove', onTouchMove, { passive: false });
      document.body.addEventListener('touchend', onTouchEnd, { passive: false });
      document.body.addEventListener('touchcancel', onTouchEnd, { passive: false });
      pointerListening = true;
    }
  }

  state.dispose = () => {
    pointerMap.delete(el);
    if (pointerMap.size === 0) {
      document.body.removeEventListener('pointermove', onPointerMove);
      document.body.removeEventListener('pointerleave', onPointerLeave);
      document.body.removeEventListener('click', onPointerClick);
      document.body.removeEventListener('touchstart', onTouchStart);
      document.body.removeEventListener('touchmove', onTouchMove);
      document.body.removeEventListener('touchend', onTouchEnd);
      document.body.removeEventListener('touchcancel', onTouchEnd);
      pointerListening = false;
    }
  };
  return state;
}

function hitTest(rect: DOMRect) {
  return pointerPos.x >= rect.left && pointerPos.x <= rect.left + rect.width && pointerPos.y >= rect.top && pointerPos.y <= rect.top + rect.height;
}

function updatePositions(state: any, rect: DOMRect) {
  state.position.x = pointerPos.x - rect.left;
  state.position.y = pointerPos.y - rect.top;
  state.nPosition.x = (state.position.x / rect.width) * 2 - 1;
  state.nPosition.y = (-state.position.y / rect.height) * 2 + 1;
}

function processInteraction() {
  for (const [elem, state] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    if (hitTest(rect)) {
      updatePositions(state, rect);
      if (!state.hover) { state.hover = true; state.onEnter(state); }
      state.onMove(state);
    } else if (state.hover && !state.touching) {
      state.hover = false;
      state.onLeave(state);
    }
  }
}

function onPointerMove(e: PointerEvent) { pointerPos.x = e.clientX; pointerPos.y = e.clientY; processInteraction(); }
function onPointerClick(e: MouseEvent) {
  pointerPos.x = e.clientX; pointerPos.y = e.clientY;
  for (const [elem, state] of pointerMap) { const r = elem.getBoundingClientRect(); updatePositions(state, r); if (hitTest(r)) state.onClick(state); }
}
function onPointerLeave() { for (const state of pointerMap.values()) { if (state.hover) { state.hover = false; state.onLeave(state); } } }
function onTouchStart(e: TouchEvent) {
  if (!e.touches.length) return; e.preventDefault();
  pointerPos.x = e.touches[0].clientX; pointerPos.y = e.touches[0].clientY;
  for (const [elem, state] of pointerMap) { const r = elem.getBoundingClientRect(); if (hitTest(r)) { state.touching = true; updatePositions(state, r); if (!state.hover) { state.hover = true; state.onEnter(state); } state.onMove(state); } }
}
function onTouchMove(e: TouchEvent) {
  if (!e.touches.length) return; e.preventDefault();
  pointerPos.x = e.touches[0].clientX; pointerPos.y = e.touches[0].clientY;
  for (const [elem, state] of pointerMap) { const r = elem.getBoundingClientRect(); updatePositions(state, r); if (hitTest(r)) { if (!state.hover) { state.hover = true; state.touching = true; state.onEnter(state); } state.onMove(state); } else if (state.hover && state.touching) { state.onMove(state); } }
}
function onTouchEnd() { for (const [, state] of pointerMap) { if (state.touching) { state.touching = false; if (state.hover) { state.hover = false; state.onLeave(state); } } } }

/* ── Physics ── */
const { randFloat, randFloatSpread } = MathUtils;
const tmpA = new Vector3(), tmpB = new Vector3(), tmpC = new Vector3(), tmpD = new Vector3(), tmpE = new Vector3(), tmpF = new Vector3(), tmpG = new Vector3(), tmpH = new Vector3(), tmpI = new Vector3(), tmpJ = new Vector3();

class Physics {
  config: any;
  positionData: Float32Array;
  velocityData: Float32Array;
  sizeData: Float32Array;
  center = new Vector3();

  constructor(config: any) {
    this.config = config;
    this.positionData = new Float32Array(3 * config.count).fill(0);
    this.velocityData = new Float32Array(3 * config.count).fill(0);
    this.sizeData = new Float32Array(config.count).fill(1);
    this.#initPositions();
    this.setSizes();
  }

  #initPositions() {
    const { config, positionData } = this;
    this.center.toArray(positionData, 0);
    for (let i = 1; i < config.count; i++) {
      const base = 3 * i;
      positionData[base] = randFloatSpread(2 * config.maxX);
      positionData[base + 1] = randFloatSpread(2 * config.maxY);
      positionData[base + 2] = randFloatSpread(2 * config.maxZ);
    }
  }

  setSizes() {
    const { config, sizeData } = this;
    sizeData[0] = config.size0;
    for (let i = 1; i < config.count; i++) sizeData[i] = randFloat(config.minSize, config.maxSize);
  }

  update(time: any) {
    const { config: cfg, center, positionData: pos, sizeData: sizes, velocityData: vel } = this;
    let start = 0;
    if (cfg.controlSphere0) {
      start = 1;
      tmpA.fromArray(pos, 0).lerp(center, 0.1).toArray(pos, 0);
      tmpD.set(0, 0, 0).toArray(vel, 0);
    }
    for (let i = start; i < cfg.count; i++) {
      const b = 3 * i;
      tmpB.fromArray(pos, b);
      tmpE.fromArray(vel, b);
      tmpE.y -= time.delta * cfg.gravity * sizes[i];
      tmpE.multiplyScalar(cfg.friction).clampLength(0, cfg.maxVelocity);
      tmpB.add(tmpE);
      tmpB.toArray(pos, b);
      tmpE.toArray(vel, b);
    }
    for (let i = start; i < cfg.count; i++) {
      const b = 3 * i;
      tmpB.fromArray(pos, b);
      tmpE.fromArray(vel, b);
      const r = sizes[i];
      for (let j = i + 1; j < cfg.count; j++) {
        const ob = 3 * j;
        tmpC.fromArray(pos, ob);
        tmpF.fromArray(vel, ob);
        const or2 = sizes[j];
        tmpG.copy(tmpC).sub(tmpB);
        const dist = tmpG.length();
        const sumR = r + or2;
        if (dist < sumR) {
          const overlap = sumR - dist;
          tmpH.copy(tmpG).normalize().multiplyScalar(0.5 * overlap);
          tmpI.copy(tmpH).multiplyScalar(Math.max(tmpE.length(), 1));
          tmpJ.copy(tmpH).multiplyScalar(Math.max(tmpF.length(), 1));
          tmpB.sub(tmpH); tmpE.sub(tmpI);
          tmpB.toArray(pos, b); tmpE.toArray(vel, b);
          tmpC.add(tmpH); tmpF.add(tmpJ);
          tmpC.toArray(pos, ob); tmpF.toArray(vel, ob);
        }
      }
      if (cfg.controlSphere0) {
        tmpG.copy(tmpA).sub(tmpB);
        const dist = tmpG.length();
        const sumR0 = r + sizes[0];
        if (dist < sumR0) {
          const diff = sumR0 - dist;
          tmpH.copy(tmpG.normalize()).multiplyScalar(diff);
          tmpI.copy(tmpH).multiplyScalar(Math.max(tmpE.length(), 2));
          tmpB.sub(tmpH); tmpE.sub(tmpI);
        }
      }
      if (Math.abs(tmpB.x) + r > cfg.maxX) { tmpB.x = Math.sign(tmpB.x) * (cfg.maxX - r); tmpE.x = -tmpE.x * cfg.wallBounce; }
      if (cfg.gravity === 0) {
        if (Math.abs(tmpB.y) + r > cfg.maxY) { tmpB.y = Math.sign(tmpB.y) * (cfg.maxY - r); tmpE.y = -tmpE.y * cfg.wallBounce; }
      } else if (tmpB.y - r < -cfg.maxY) { tmpB.y = -cfg.maxY + r; tmpE.y = -tmpE.y * cfg.wallBounce; }
      const maxBound = Math.max(cfg.maxZ, cfg.maxSize);
      if (Math.abs(tmpB.z) + r > maxBound) { tmpB.z = Math.sign(tmpB.z) * (cfg.maxZ - r); tmpE.z = -tmpE.z * cfg.wallBounce; }
      tmpB.toArray(pos, b); tmpE.toArray(vel, b);
    }
  }
}

/* ── SSS Material ── */
class SSSMaterial extends MeshPhysicalMaterial {
  uniforms: any;
  onBeforeCompile2?: any;
  constructor(params: any) {
    super(params);
    this.uniforms = { thicknessDistortion: { value: 0.1 }, thicknessAmbient: { value: 0 }, thicknessAttenuation: { value: 0.1 }, thicknessPower: { value: 2 }, thicknessScale: { value: 10 } };
    this.defines.USE_UV = '';
    this.onBeforeCompile = (shader: any) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader = `
        uniform float thicknessPower; uniform float thicknessScale; uniform float thicknessDistortion; uniform float thicknessAmbient; uniform float thicknessAttenuation;
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', `
        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
          #ifdef USE_COLOR
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;
          #else
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;
          #endif
          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
        }
        void main() {
      `);
      const replaced = ShaderChunk.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        `RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);`
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', replaced);
      if (this.onBeforeCompile2) this.onBeforeCompile2(shader);
    };
  }
}

/* ── Spheres ── */
const DEFAULTS = {
  count: 200, colors: [0, 0, 0], ambientColor: 0xffffff, ambientIntensity: 1, lightIntensity: 200,
  materialParams: { metalness: 0.5, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 },
  minSize: 0.5, maxSize: 1, size0: 1, gravity: 0.5, friction: 0.9975, wallBounce: 0.95,
  maxVelocity: 0.15, maxX: 5, maxY: 5, maxZ: 2, controlSphere0: false, followCursor: true
};

const dummy = new Object3D();

class Spheres extends InstancedMesh {
  config: any;
  physics: Physics;
  ambientLight: AmbientLight;
  light: PointLight;

  constructor(renderer: WebGLRenderer, opts: any = {}) {
    const cfg = { ...DEFAULTS, ...opts };
    const env = new PMREMGenerator(renderer, 0.04).fromScene(new RoomEnvironment()).texture;
    const geo = new SphereGeometry();
    const mat = new SSSMaterial({ envMap: env, ...cfg.materialParams });
    (mat as any).envMapRotation.x = -Math.PI / 2;
    super(geo, mat, cfg.count);
    this.config = cfg;
    this.physics = new Physics(cfg);

    this.ambientLight = new AmbientLight(cfg.ambientColor, cfg.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new PointLight(cfg.colors[0], cfg.lightIntensity);
    this.add(this.light);

    this.setColors(cfg.colors);
  }

  setColors(colors: number[]) {
    if (!Array.isArray(colors) || colors.length < 2) return;
    const cols = colors.map((c: number) => new Color(c));
    for (let i = 0; i < this.count; i++) {
      const ratio = Math.max(0, Math.min(1, i / this.count)) * (cols.length - 1);
      const idx = Math.floor(ratio);
      const start = cols[idx];
      if (idx >= cols.length - 1) { this.setColorAt(i, start); } else {
        const alpha = ratio - idx;
        const end = cols[idx + 1];
        const out = new Color(start.r + alpha * (end.r - start.r), start.g + alpha * (end.g - start.g), start.b + alpha * (end.b - start.b));
        this.setColorAt(i, out);
      }
      if (i === 0) this.light.color.copy(cols[0]);
    }
    this.instanceColor!.needsUpdate = true;
  }

  update(time: any) {
    this.physics.update(time);
    for (let i = 0; i < this.count; i++) {
      dummy.position.fromArray(this.physics.positionData, 3 * i);
      dummy.scale.setScalar(i === 0 && !this.config.followCursor ? 0 : this.physics.sizeData[i]);
      dummy.updateMatrix();
      this.setMatrixAt(i, dummy.matrix);
      if (i === 0) this.light.position.copy(dummy.position);
    }
    this.instanceMatrix!.needsUpdate = true;
  }
}

/* ── createBallpit ── */
function createBallpit(canvas: HTMLCanvasElement, opts: any = {}) {
  const app = new ThreeApp({ canvas, size: 'parent', rendererOptions: { antialias: true, alpha: true } });
  let spheres: Spheres;
  app.renderer.toneMapping = ACESFilmicToneMapping;
  app.camera.position.set(0, 0, 20);
  app.camera.lookAt(0, 0, 0);
  app.cameraMaxAspect = 1.5;
  app.resize();

  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const hitPoint = new Vector3();
  let paused = false;

  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  (canvas.style as any).webkitUserSelect = 'none';

  const pointer = setupPointer({
    domElement: canvas,
    onMove() {
      raycaster.setFromCamera(pointer.nPosition, app.camera);
      app.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, hitPoint);
      spheres.physics.center.copy(hitPoint);
      spheres.config.controlSphere0 = true;
    },
    onLeave() { spheres.config.controlSphere0 = false; }
  });

  function init(o: any) {
    if (spheres) { app.clear(); app.scene.remove(spheres); }
    spheres = new Spheres(app.renderer, o);
    app.scene.add(spheres);
  }

  init(opts);
  app.onBeforeRender = (time: any) => { if (!paused) spheres.update(time); };
  app.onAfterResize = (size: any) => { spheres.config.maxX = size.wWidth / 2; spheres.config.maxY = size.wHeight / 2; };

  return {
    three: app,
    get spheres() { return spheres; },
    dispose() { pointer.dispose(); app.dispose(); }
  };
}

/* ── React Component ── */
interface BallpitProps {
  className?: string;
  followCursor?: boolean;
  count?: number;
  colors?: number[];
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  [key: string]: any;
}

const Ballpit = ({ className = '', followCursor = true, ...props }: BallpitProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<ReturnType<typeof createBallpit> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createBallpit(canvas, { followCursor, ...props });
    return () => { instanceRef.current?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas className={`${className} w-full h-full`} ref={canvasRef} />;
};

export default Ballpit;
