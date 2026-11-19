import * as THREE from './vendor/three.module.js';
import { CarouselMotion } from './motion.js';
import { createDepthMaterial } from './depth-material.js?v=3';
import { calculateLayout } from './layout.js';

// Composition coordinates follow the 1600 × 981 reference.
const WIDTH = 1600, HEIGHT = 917;
const RADIUS = 650, CARD_HEIGHT = 300, CARD_ARC = 1.16;
const cards = [
  { title: 'Московские ярмарки', image: 'fairs.jpg' },
  { title: 'Сделано в Москве', image: 'made-in-moscow.jpg' },
  { title: 'Рецепты', image: 'recipes.jpg' },
  { title: 'Проекты', image: 'projects.png' },
  { title: 'Рыбные рынки', image: 'fish-markets.jpg' },
];
const container = document.querySelector('.front-scene');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const motion = new CarouselMotion({ reduced: reduced.matches });
let scale = 1;
function resize() {
  const layout = calculateLayout(innerWidth, innerHeight);
  scale = layout.sceneScale;
  const style = document.documentElement.style;
  style.setProperty('--scale', layout.headerScale);
  style.setProperty('--hero-height', `${layout.heroLocalHeight}px`);
  style.setProperty('--board-height', `${layout.boardLocalHeight}px`);
  style.setProperty('--content-scale', layout.contentScale);
  document.body.style.height = `${layout.pageHeight}px`;
}
resize();
addEventListener('resize', resize);
reduced.addEventListener('change', e => { motion.reduced = e.matches; });

async function createTexture(card) {
  const image = new Image();
  image.src = `assets/${card.image}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1536; canvas.height = 648;
  const ctx = canvas.getContext('2d');
  const cropScale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const w = image.width * cropScale, h = image.height * cropScale;
  ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  const gradient = ctx.createLinearGradient(0, 250, 0, 648);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,.65)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1536, 648);
  ctx.font = '400 80px "Dela Gothic One"';
  ctx.fillStyle = '#fff';
  ctx.fillText(card.title, 64, 562, 1408);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

async function init() {
  await Promise.all([document.fonts.load('600 280px "Roboto Flex"'), document.fonts.load('400 80px "Dela Gothic One"')]);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(8.74, WIDTH / HEIGHT, 1, 10000);
  camera.position.set(0, 0, 6000);
  const renderers = ['.rear-scene', '.front-scene'].map(selector => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0xffffff, 0);
    document.querySelector(selector).append(renderer.domElement);
    return renderer;
  });
  const tilt = new THREE.Group();
  tilt.rotation.set(.36, 0, -.24, 'ZXY');
  tilt.position.set(0, 70, 0);
  scene.add(tilt);
  const ring = new THREE.Group();
  tilt.add(ring);
  const textures = await Promise.all(cards.map(createTexture));
  const depthPass = { value: 0 };
  const meshes = textures.map((texture, index) => {
    // Each card is an actual cylinder segment, so its image and text bend together.
    const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, CARD_HEIGHT, 64, 1, true, -CARD_ARC / 2, CARD_ARC);
    const material = createDepthMaterial(texture, depthPass);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = index * Math.PI * 2 / cards.length;
    mesh.userData.title = cards[index].title;
    mesh.layers.enable(1);
    ring.add(mesh);
    return mesh;
  });
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(10,10);
  const center = new THREE.Vector3();
  let pointerInside = false, pointerId = null, lastFrame = null, releasedUntil = 0;
  const frontMeshes = [];
  function updatePointer(e) {
    const rect = container.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    pointerInside = true;
  }
  function hitFront() {
    if (!pointerInside) return null;
    raycaster.layers.set(1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(frontMeshes)[0] || null;
  }
  container.addEventListener('pointermove', e => {
    updatePointer(e);
    if (e.pointerId === pointerId) motion.move(e.clientX / scale, e.timeStamp);
  });
  container.addEventListener('pointerdown', e => {
    updatePointer(e);
    if (e.button !== 0 || pointerId !== null || !hitFront()) return;
    pointerId = e.pointerId;
    motion.begin(e.clientX / scale, e.timeStamp);
    container.setPointerCapture(e.pointerId);
    container.classList.add('is-dragging');
  });
  function release(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    motion.end();
    releasedUntil = performance.now() + 1100;
    container.classList.remove('is-dragging');
  }
  container.addEventListener('pointerup', release);
  container.addEventListener('pointercancel', release);
  container.addEventListener('lostpointercapture', release);
  container.addEventListener('pointerleave', () => { pointerInside = false; motion.hovered = false; });
  container.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    motion.angle += (e.key === 'ArrowRight' ? 1 : -1) * Math.PI * 2 / cards.length;
    motion.velocity = 0;
  });
  document.addEventListener('visibilitychange', () => {
    lastFrame = null; motion.end(); motion.hovered = false;
    pointerId = null; pointerInside = false;
    container.classList.remove('is-dragging', 'is-hovered');
  });
  function frame(time) {
    requestAnimationFrame(frame);
    if (document.hidden) { lastFrame = null; return; }
    const dt = lastFrame === null ? 0 : (time - lastFrame) / 1000;
    lastFrame = time;
    const hit = hitFront();
    motion.hovered = !!hit && !motion.dragging && time > releasedUntil;
    container.classList.toggle('is-hovered', !!hit);
    motion.tick(dt);
    ring.rotation.y = motion.angle;
    scene.updateMatrixWorld(true);
    frontMeshes.length = 0;
    for (const mesh of meshes) {
      center.set(0, 0, RADIUS).applyMatrix4(mesh.matrixWorld);
      // Picking stays restricted to front cards; rendering blends both passes per pixel.
      if (center.z > 0) frontMeshes.push(mesh);
    }
    depthPass.value = 0;
    camera.layers.set(0); renderers[0].render(scene, camera);
    depthPass.value = 1;
    camera.layers.set(1); renderers[1].render(scene, camera);
  }
  requestAnimationFrame(frame);
}
init().catch(error => {
  console.error(error);
  document.querySelector('.error').hidden = false;
});
