// Minecraft-oriented 3D helper that attempts to import common 3D engines (three, Babylon, PlayCanvas)
// and initializes only the first one that successfully loads. It exposes a minimal "voxel-like"
// API suitable for simple Minecraft-style blocks: addBlock / removeBlock, simple lighting and camera.
//
// Notes:
// - ES module with dynamic imports so bundlers or modern browsers can use it.
// - Default preference order: three -> @babylonjs/core -> playcanvas
// - The helper keeps to a single active engine (the first that successfully imports/initializes).
//
// Usage example:
// import { createEngine } from './js3dhelper.js';
// const handle = await createEngine(canvasElement, { prefer: ['three','babylon','playcanvas'], pixelRatio: 1 });
// await handle.addBlock(0,0,0, { texture: '/assets/textures/grass.png' });
// handle.start();
//
// Returned handle:
// { libName, engine/renderer, scene, camera, addBlock, removeBlock, setSun, start, stop, dispose }
//

const DEFAULT_ORDER = ['three', '@babylonjs/core', 'playcanvas'];

async function tryImport(spec) {
  try {
    return await import(spec);
  } catch (err) {
    // silent failure so we can try the next library
    return null;
  }
}

function fitCanvasToDisplaySize(canvas) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

/* ---------------- THREE.JS IMPLEMENTATION ---------------- */
async function initThree(mod, canvas, opts = {}) {
  // mod is the 'three' module
  const {
    Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, MeshLambertMaterial,
    Mesh, TextureLoader, AmbientLight, DirectionalLight, Color, Vector3, Group
  } = mod;

  const dpr = opts.pixelRatio || Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  // Modern Three.js uses outputColorSpace; older versions use outputEncoding.
  // Prefer the modern API when available.
  if ('outputColorSpace' in renderer && mod.SRGBColorSpace !== undefined) {
    renderer.outputColorSpace = mod.SRGBColorSpace;
  } else {
    renderer.outputEncoding = mod.sRGBEncoding || mod.LinearEncoding;
  }

  const scene = new Scene();
  scene.background = new Color(opts.background || 0x87ceeb); // sky-ish

  const camera = new PerspectiveCamera(70, canvas.clientWidth / Math.max(1, canvas.clientHeight), 0.1, 1000);
  camera.position.set(8, 8, 8);
  camera.lookAt(new Vector3(0, 0, 0));

  // lighting
  const ambient = new AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const sun = new DirectionalLight(0xffffff, 0.8);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  scene.add(sun);

  // world container
  const world = new Group();
  scene.add(world);

  const loader = new TextureLoader();

  // store block meshes by key "x,y,z"
  const blocks = new Map();
  const blockSize = opts.blockSize || 1;

  function blockKey(x, y, z) { return `${x},${y},${z}`; }

  async function makeMaterial(settings = {}) {
    if (settings.texture) {
      try {
        const tex = await new Promise((res, rej) => loader.load(settings.texture, res, undefined, rej));
        // if NearestFilter exists, prefer pixelated look for Minecraft textures
        if (mod.NearestFilter !== undefined) {
          tex.magFilter = mod.NearestFilter;
          tex.minFilter = mod.NearestFilter;
        }
        const mat = new MeshLambertMaterial({ map: tex });
        return mat;
      } catch (e) {
        // fallback to color
      }
    }
    return new MeshLambertMaterial({ color: settings.color || 0x8B4513 });
  }

  // create a simple cube with scaled UVs (not optimized — simple usage)
  const boxGeo = new BoxGeometry(blockSize, blockSize, blockSize);

  async function addBlock(x, y, z, settings = {}) {
    const key = blockKey(x, y, z);
    if (blocks.has(key)) return blocks.get(key);
    const mat = await makeMaterial(settings);
    const mesh = new Mesh(boxGeo.clone(), mat);
    mesh.position.set(
      x * blockSize + blockSize / 2,
      y * blockSize + blockSize / 2,
      z * blockSize + blockSize / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.add(mesh);
    blocks.set(key, mesh);
    return mesh;
  }

  function removeBlock(x, y, z) {
    const key = blockKey(x, y, z);
    const m = blocks.get(key);
    if (!m) return false;
    world.remove(m);
    if (m.geometry) m.geometry.dispose?.();
    if (m.material) {
      if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose?.());
      else m.material.dispose?.();
    }
    blocks.delete(key);
    return true;
  }

  function setSun(dir, color = 0xffffff, intensity = 0.8) {
    sun.position.set(dir.x, dir.y, dir.z);
    sun.color = new Color(color);
    sun.intensity = intensity;
  }

  // animation loop
  let raf = null;
  let last = 0;
  function render(t) {
    // adapt to size changes
    if (fitCanvasToDisplaySize(canvas)) {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    }
    const time = t || performance.now();
    const dt = (time - last) * 0.001;
    last = time;
    renderer.render(scene, camera);
  }

  function start() {
    if (raf != null) return;
    const loop = (t) => {
      render(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (raf == null) return;
    cancelAnimationFrame(raf);
    raf = null;
  }

  function dispose() {
    stop();
    try {
      world.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose?.();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
            else o.material.dispose?.();
          }
        }
      });
      renderer.dispose?.();
    } catch (e) {}
  }

  return {
    libName: 'three',
    renderer,
    scene,
    camera,
    addBlock,
    removeBlock,
    setSun,
    start,
    stop,
    dispose,
    _internal: { world, blocks }
  };
}

/* ---------------- BABYLON.JS IMPLEMENTATION ---------------- */
async function initBabylon(mod, canvas, opts = {}) {
  // try to use either the namespaced @babylonjs/core import or similar
  const { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, DirectionalLight, MeshBuilder, StandardMaterial, Texture, Color3 } = mod;

  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new Scene(engine);

  scene.clearColor = new Color3(0.53, 0.81, 0.92); // sky-like

  const camera = new ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 3, 20, new Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);

  const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.7;
  const sun = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
  sun.position = new Vector3(10, 20, 10);
  sun.intensity = 0.8;

  const blockSize = opts.blockSize || 1;
  const blocks = new Map();
  function blockKey(x, y, z) { return `${x},${y},${z}`; }

  async function makeMaterial(settings = {}) {
    const mat = new StandardMaterial("mat", scene);
    if (settings.texture) {
      try {
        mat.diffuseTexture = new Texture(settings.texture, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE);
        mat.diffuseTexture.hasAlpha = false;
      } catch (e) {
        mat.diffuseColor = Color3.FromHexString(settings.color ? `#${settings.color.toString(16).padStart(6,'0')}` : "#8B4513");
      }
    } else {
      mat.diffuseColor = Color3.FromHexString(settings.color ? `#${settings.color.toString(16).padStart(6,'0')}` : "#8B4513");
    }
    return mat;
  }

  async function addBlock(x, y, z, settings = {}) {
    const key = blockKey(x, y, z);
    if (blocks.has(key)) return blocks.get(key);
    const mesh = MeshBuilder.CreateBox(`b${key}`, { size: blockSize }, scene);
    mesh.position = new Vector3(x * blockSize + blockSize / 2, y * blockSize + blockSize / 2, z * blockSize + blockSize / 2);
    mesh.material = await makeMaterial(settings);
    mesh.receiveShadows = true;
    blocks.set(key, mesh);
    return mesh;
  }

  function removeBlock(x, y, z) {
    const key = blockKey(x, y, z);
    const m = blocks.get(key);
    if (!m) return false;
    m.dispose();
    blocks.delete(key);
    return true;
  }

  function setSun(dir, color = 0xffffff, intensity = 0.8) {
    sun.direction = new Vector3(dir.x, dir.y, dir.z);
    sun.diffuse = Color3.FromArray([(color >> 16 & 255) / 255, (color >> 8 & 255) / 255, (color & 255) / 255]);
    sun.intensity = intensity;
  }

  engine.runRenderLoop(() => {
    scene.render();
  });

  function start() { engine.runRenderLoop(() => scene.render()); }
  function stop() { engine.stopRenderLoop?.(() => scene.render()); }
  function dispose() {
    try { scene.dispose(); engine.dispose(); } catch (e) {}
  }

  return {
    libName: 'babylon',
    engine,
    scene,
    camera,
    addBlock,
    removeBlock,
    setSun,
    start,
    stop,
    dispose,
    _internal: { blocks }
  };
}

/* ---------------- PLAYCANVAS IMPLEMENTATION (BEST-EFFORT) ---------------- */
async function initPlaycanvas(mod, canvas, opts = {}) {
  // PlayCanvas is usually a global; some distributions export as module. We do a best-effort.
  const pc = mod;
  // create application
  const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(document.body),
    touch: new pc.TouchDevice(document.body),
    keyboard: new pc.Keyboard(window)
  });
  app.start();
  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.scene.ambientLight = new pc.Color(0.6, 0.6, 0.6);

  // directional light (sun)
  const sun = new pc.Entity();
  sun.addComponent('light', {
    type: 'directional',
    color: new pc.Color(1, 1, 1),
    intensity: 0.9
  });
  sun.setLocalEulerAngles(45, 0, 0);
  app.root.addChild(sun);

  const camera = new pc.Entity();
  camera.addComponent('camera', {
    clearColor: new pc.Color(0.53, 0.81, 0.92)
  });
  camera.setLocalPosition(8, 8, 8);
  camera.lookAt(0, 0, 0);
  app.root.addChild(camera);

  const blocks = new Map();
  const blockSize = opts.blockSize || 1;
  function blockKey(x, y, z) { return `${x},${y},${z}`; }

  async function addBlock(x, y, z, settings = {}) {
    const key = blockKey(x, y, z);
    if (blocks.has(key)) return blocks.get(key);
    const ent = new pc.Entity();
    ent.addComponent('model', { type: 'box' });
    ent.setLocalScale(blockSize, blockSize, blockSize);
    ent.setLocalPosition(x * blockSize + blockSize/2, y * blockSize + blockSize/2, z * blockSize + blockSize/2);
    if (settings.texture) {
      const asset = new pc.Asset(`tex-${key}`, 'texture', { url: settings.texture });
      app.assets.add(asset);
      await new Promise((res) => asset.ready(() => res()));
      const material = new pc.StandardMaterial();
      material.diffuseMap = asset.resource;
      material.update();
      ent.model.model.meshInstances.forEach(mi => mi.material = material);
    } else {
      const material = new pc.StandardMaterial();
      material.diffuse = new pc.Color(0.54, 0.27, 0.07);
      material.update();
      ent.model.model.meshInstances.forEach(mi => mi.material = material);
    }
    app.root.addChild(ent);
    blocks.set(key, ent);
    return ent;
  }

  function removeBlock(x, y, z) {
    const key = blockKey(x, y, z);
    const e = blocks.get(key);
    if (!e) return false;
    e.destroy();
    blocks.delete(key);
    return true;
  }

  function setSun(dir, color = 0xffffff, intensity = 0.9) {
    sun.setLocalEulerAngles(dir.x, dir.y, dir.z);
    sun.light.intensity = intensity;
    sun.light.color = new pc.Color((color>>16&255)/255, (color>>8&255)/255, (color&255)/255);
  }

  function start() { app.resume(); }
  function stop() { app.pause(); }
  function dispose() {
    try { app.destroy(); } catch (e) {}
  }

  return {
    libName: 'playcanvas',
    app,
    scene: app.scene,
    camera,
    addBlock,
    removeBlock,
    setSun,
    start,
    stop,
    dispose,
    _internal: { blocks }
  };
}

/* ---------------- FACTORY ---------------- */
export async function createEngine(canvas, options = {}) {
  const prefer = options.prefer || DEFAULT_ORDER;

  for (const name of prefer) {
    if (name === 'three') {
      const mod = await tryImport('three');
      if (mod) {
        try { return await initThree(mod, canvas, options); } catch (e) {}
      }
    } else if (name === '@babylonjs/core' || name === 'babylon') {
      const mod = await tryImport('@babylonjs/core') || await tryImport('babylonjs');
      if (mod) {
        try { return await initBabylon(mod, canvas, options); } catch (e) {}
      }
    } else if (name === 'playcanvas') {
      const mod = await tryImport('playcanvas') || (window && window.pc ? window.pc : null);
      if (mod) {
        try { return await initPlaycanvas(mod, canvas, options); } catch (e) {}
      }
    } else {
      // try raw specifier
      const mod = await tryImport(name);
      if (mod) {
        // best-effort detection
        if (mod.WebGLRenderer && mod.Scene && mod.PerspectiveCamera) {
          try { return await initThree(mod, canvas, options); } catch (e) {}
        } else if (mod.Engine && mod.Scene) {
          try { return await initBabylon(mod, canvas, options); } catch (e) {}
        } else if (mod.Application || (mod.pc && mod.pc.Application)) {
          try { return await initPlaycanvas(mod, canvas, options); } catch (e) {}
        }
      }
    }
  }

  throw new Error('No supported 3D engine available. Install or load three, @babylonjs/core or playcanvas.');
}

export default { createEngine };
