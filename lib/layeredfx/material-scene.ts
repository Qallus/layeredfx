import * as THREE from "three";
import type { FinishId } from "./content";
export interface MaterialSceneControls {
  setFinish: (finish: FinishId) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
}
const colors: Record<FinishId, string> = { clay: "#c8b399", oak: "#aa7a4e", stone: "#d1cec2", charcoal: "#52554e" };

// Original, procedural sample textures. No vendor imagery or network requests.
function makeTexture(id: FinishId) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable.");
  ctx.fillStyle = colors[id]; ctx.fillRect(0, 0, 256, 256);
  let seed = 19027;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(${random() > 0.5 ? "255,255,255" : "30,24,15"},${random() * 0.095})`;
    const size = id === "stone" ? 2 : 1; ctx.fillRect(random() * 256, random() * 256, size, size);
  }
  if (id === "oak") {
    for (let x = 0; x < 256; x += 3) { ctx.strokeStyle = `rgba(56,31,14,${0.07 + random() * 0.11})`; ctx.lineWidth = 0.4 + random(); ctx.beginPath(); for (let y = 0; y <= 256; y += 4) { const dx = Math.sin(y / 48 + x / 13) * 3 + Math.sin(y / 94) * 5; if (y === 0) ctx.moveTo(x + dx, y); else ctx.lineTo(x + dx, y); } ctx.stroke(); }
  }
  if (id === "stone") { for (let i = 0; i < 6; i++) { ctx.beginPath(); const y = random() * 256; ctx.moveTo(0, y); ctx.bezierCurveTo(60, y - 80, 140, y + 100, 256, y - 40); ctx.strokeStyle = "rgba(255,255,250,.22)"; ctx.lineWidth = 2 + random() * 3; ctx.stroke(); } }
  if (id === "clay") { for (let i = 0; i < 22; i++) { const x = random() * 256, y = random() * 256; const gradient = ctx.createRadialGradient(x, y, 0, x, y, 54); gradient.addColorStop(0, "rgba(255,245,224,.075)"); gradient.addColorStop(1, "rgba(255,245,224,0)"); ctx.fillStyle = gradient; ctx.fillRect(x - 54, y - 54, 108, 108); } }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 2;
  return texture;
}

export function mountMaterialScene(container: HTMLElement, initialFinish: FinishId = "clay", onContextLost?: () => void): MaterialSceneControls {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const canvas = renderer.domElement; canvas.setAttribute("aria-hidden", "true"); container.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40); camera.position.set(0, 0, 9.4);
  scene.add(new THREE.HemisphereLight(0xfff9ef, 0x666057, 2.2));
  const key = new THREE.DirectionalLight(0xffedda, 3.0); key.position.set(-4, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1.5); fill.position.set(4, 0, 3); scene.add(fill);
  const textures = Object.fromEntries((Object.keys(colors) as FinishId[]).map(id => [id, makeTexture(id)])) as Record<FinishId, THREE.CanvasTexture>;
  const geometry = new THREE.BoxGeometry(2.6, 3.35, 0.075);
  const group = new THREE.Group(); scene.add(group);
  const materials: THREE.MeshStandardMaterial[] = [];
  ["oak", "stone", initialFinish].forEach((value, index) => {
    const id = value as FinishId;
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: textures[id], bumpMap: textures[id], bumpScale: 0.014, roughness: 0.92, metalness: 0 }); materials.push(material);
    const panel = new THREE.Mesh(geometry, material); panel.position.set((index - 1) * 0.34, (index - 1) * -0.05, (index - 1) * 0.33); panel.rotation.z = (index - 1) * -0.115; group.add(panel);
  });
  const edges = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x72614f, transparent: true, opacity: 0.12 });
  group.children.forEach(child => child.add(new THREE.LineSegments(edges, edgeMaterial)));
  group.rotation.set(-0.16, -0.40, -0.13);
  let targetX = 0, targetY = 0, frame = 0, paused = false, disposed = false;
  const startedAt = performance.now();
  function render(now: number) {
    if (disposed) return;
    const time = (now - startedAt) / 1000;
    if (!paused) {
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, -0.40 + targetX * 0.16 + Math.sin(time * 0.27) * 0.045, 0.035);
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -0.16 - targetY * 0.09, 0.035);
      group.position.y = Math.sin(time * 0.65) * 0.065;
    }
    renderer.render(scene, camera);
    if (!paused) frame = requestAnimationFrame(render);
  }
  function resize() { const width = Math.max(container.clientWidth, 1), height = Math.max(container.clientHeight, 1); renderer.setSize(width, height, false); camera.aspect = width / height; camera.position.z = camera.aspect < 1 ? 10.8 : 9.4; camera.updateProjectionMatrix(); if (paused) renderer.render(scene, camera); }
  function pointer(event: PointerEvent) { const rect = container.getBoundingClientRect(); targetX = (event.clientX - rect.left) / rect.width * 2 - 1; targetY = (event.clientY - rect.top) / rect.height * 2 - 1; }
  function pointerLeave() { targetX = 0; targetY = 0; }
  function contextLost(event: Event) { event.preventDefault(); paused = true; cancelAnimationFrame(frame); onContextLost?.(); }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
  container.addEventListener("pointermove", pointer); container.addEventListener("pointerleave", pointerLeave); canvas.addEventListener("webglcontextlost", contextLost);
  resize(); frame = requestAnimationFrame(render);
  return {
    setFinish(id) { if (disposed || !textures[id]) return; materials[2].map = textures[id]; materials[2].bumpMap = textures[id]; materials[2].needsUpdate = true; if (paused) renderer.render(scene, camera); },
    setPaused(value) { if (disposed || paused === value) return; paused = value; cancelAnimationFrame(frame); if (paused) renderer.render(scene, camera); else frame = requestAnimationFrame(render); },
    dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); container.removeEventListener("pointermove", pointer); container.removeEventListener("pointerleave", pointerLeave); canvas.removeEventListener("webglcontextlost", contextLost); geometry.dispose(); edges.dispose(); edgeMaterial.dispose(); materials.forEach(material => material.dispose()); Object.values(textures).forEach(texture => texture.dispose()); renderer.dispose(); canvas.remove(); },
  };
}
