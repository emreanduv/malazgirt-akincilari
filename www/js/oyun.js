/* Malazgirt Akıncıları — çizim, ses, ekranlar ve kayıt. Oyun kuralları js/mantik.js içinde. */
(function () {
'use strict';
const M = window.MANTIK;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FONT = '"Baloo 2","Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
const NL = M.LEVELS.length;

/* ================= KAYIT ================= */
const SKEY = 'malazgirt-akincilari-v1';
let S = { coins: 0, unlocked: 1, stars: [], up: { start: 0, dmg: 0, rate: 0, zirh: 0 }, sound: true, seen: 0 };
try { const s = JSON.parse(localStorage.getItem(SKEY)); if (s && typeof s === 'object') { S = Object.assign(S, s); S.up = Object.assign({ start: 0, dmg: 0, rate: 0, zirh: 0 }, s.up || {}); } } catch (e) {}
function persist() { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) {} }
const totalStars = () => S.stars.reduce((a, b) => a + (b || 0), 0);
const fmt = n => n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.', ',') + 'B' : String(Math.max(0, Math.ceil(n)));

/* ================= SES ================= */
// Bütün sesler WebAudio ile anlık üretilir: dosya yok, internet yok.
let AC = null, MASTER = null, NOISE = null, drumT = 0, drumOn = false;
function audio() {
  if (AC) return AC;
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  const comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(AC.destination);
  MASTER = AC.createGain(); MASTER.gain.value = 0.8; MASTER.connect(comp);
  NOISE = AC.createBuffer(1, AC.sampleRate * 1.0, AC.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return AC;
}
function unlockAudio() { if (!S.sound) return; const a = audio(); if (a && a.state === 'suspended') a.resume(); }
function tone(f, d = 0.12, type = 'square', v = 0.04, slide = 0, delay = 0) {
  if (!S.sound || !audio()) return; const t0 = AC.currentTime + delay; const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t0 + d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(g); g.connect(MASTER); o.start(t0); o.stop(t0 + d + 0.03);
}
function noise(d = 0.15, v = 0.12, freq = 900, delay = 0, q = 0.8) {
  if (!S.sound || !audio()) return; const t0 = AC.currentTime + delay; const s = AC.createBufferSource(); s.buffer = NOISE;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q; const g = AC.createGain();
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); s.connect(f); f.connect(g); g.connect(MASTER); s.start(t0); s.stop(t0 + d + 0.02);
}
function davul(delay = 0, big = false) { tone(big ? 70 : 95, big ? 0.32 : 0.16, 'sine', big ? 0.22 : 0.12, 0.5, delay); noise(0.08, big ? 0.1 : 0.05, 500, delay); }
let lastTick = 0;
const SFX = {
  tick() { const n = performance.now(); if (n - lastTick < 60) return; lastTick = n; tone(900 + Math.random() * 300, 0.04, 'triangle', 0.025); },
  gain() { tone(880, 0.06, 'triangle', 0.04); },
  good() { tone(660, 0.09, 'triangle', 0.05); tone(990, 0.14, 'triangle', 0.05, 0, 0.08); },
  bad() { tone(220, 0.25, 'sawtooth', 0.05, 0.5); },
  crash() { noise(0.25, 0.18, 400); tone(140, 0.2, 'sawtooth', 0.04, 0.6); },
  break() { noise(0.18, 0.12, 1400); },
  weapon() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.04, 0, i * 0.07)); },
  hero() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.16, 'square', 0.045, 0, i * 0.09)); },
  click() { tone(520, 0.05, 'triangle', 0.04); },
  buy() { tone(660, 0.08, 'triangle', 0.05); tone(990, 0.12, 'triangle', 0.05, 0, 0.07); noise(0.1, 0.05, 3000, 0.05); },
  star(k) { tone(784 + k * 196, 0.18, 'triangle', 0.06); },
};
// Hicaz dizisi (Re): zurna havası
const HICAZ = [293.66, 311.13, 369.99, 392, 440, 466.16, 523.25, 587.33];
function fanfare() { davul(0, true); davul(0.26); davul(0.39); [0, 2, 3, 4, 3, 4, 6, 7].forEach((n, i) => tone(HICAZ[n] * 2, 0.17, 'square', 0.035, 0, 0.1 + i * 0.13)); davul(1.2, true); }
function sadHorn() { [4, 3, 2, 1, 0].forEach((n, i) => tone(HICAZ[n], 0.24, 'sawtooth', 0.035, 0, i * 0.18)); davul(0.95, true); }
function drumLoop(dt) {   // savaş sırasında ağır mehter davulu
  if (!drumOn || !S.sound || !AC) return; drumT -= dt;
  if (drumT <= 0) { drumT += 1.6; davul(0, true); davul(0.4); davul(0.8, true); davul(1.0); davul(1.2); }
}
const SND_ON = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
const SND_OFF = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l6 6M22 9l-6 6" stroke="#ff8a8f" stroke-width="2.2" stroke-linecap="round"/></svg>';
function drawSnd() { $('sndBtn').innerHTML = S.sound ? SND_ON : SND_OFF; $('sndBtn').setAttribute('aria-label', S.sound ? 'Sesi kapat' : 'Sesi aç'); }
$('sndBtn').addEventListener('click', () => { S.sound = !S.sound; persist(); drawSnd(); if (S.sound) { unlockAudio(); SFX.click(); } });
drawSnd();

/* ================= THREE SAHNE ================= */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xead09a); scene.fog = new THREE.Fog(0xead09a, 70, 200);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
const hemi = new THREE.HemisphereLight(0xfff4dc, 0x9c7a4a, 0.78); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d2, 0.82);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 26, bottom: -26, near: 1, far: 90 });
scene.add(sun); scene.add(sun.target);
function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 58 : 44; camera.updateProjectionMatrix(); }
window.addEventListener('resize', resize); resize();

/* Bölge renkleri: kum, yayla, göl, vadi, ova (gün batımı) */
const THEMES = [
  { sky: 0xead09a, ground: 0xd9b673, hill: [0xcfa765, 0xc69c5a, 0xd8b878, 0xbf9452], mt: 0xb99068, bush: 0x8a8a4a, sun: 0xfff0d2, hemiG: 0x9c7a4a },
  { sky: 0xd6dfc8, ground: 0xa9b07a, hill: [0x8f9d63, 0x9fa96f, 0x7f8f58, 0xb0b27c], mt: 0x8a8070, bush: 0x5d7a3e, sun: 0xfff6e2, hemiG: 0x6d7a4a },
  { sky: 0xcfe0e6, ground: 0xc7b68a, hill: [0xb3a479, 0xa7a07c, 0xbcae84, 0x9e9474], mt: 0x8b8f99, bush: 0x6f8450, sun: 0xfff4e6, hemiG: 0x7d8a8a, lake: 0x2f7fa8 },
  { sky: 0xdde6cf, ground: 0x9db06e, hill: [0x7f9a55, 0x8ea760, 0x718c4b, 0x9bb06b], mt: 0x7c7a6a, bush: 0x4f6e36, sun: 0xfff2d8, hemiG: 0x5f7a40, river: 0x4d9cc0 },
  { sky: 0xf0c48e, ground: 0xd8b46a, hill: [0xc99a55, 0xbd8f4e, 0xd2a660, 0xb5884a], mt: 0x9b6f5a, bush: 0x7d7a3e, sun: 0xffd9a0, hemiG: 0x8a5e3a }
];

/* geometri yardımcıları: renkli parçaları tek geometriye birleştir (az çizim çağrısı) */
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
function Mx(x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone().setFromEuler(_e.set(rx, ry, rz)), new THREE.Vector3(sx, sy, sz)); }
function P(geo, color, m) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); const n = g.attributes.position.count, c = new Float32Array(n * 3), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
function merge(parts) {
  let n = 0; parts.forEach(p => n += p.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  parts.forEach(p => { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); col.set(p.attributes.color.array, o * 3); o += p.attributes.position.count; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeBoundingSphere(); return g;
}
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d), CYL = (a, b, h, s) => new THREE.CylinderGeometry(a, b, h, s), SPH = (r, a, b) => new THREE.SphereGeometry(r, a, b), CONE = (r, h, s) => new THREE.ConeGeometry(r, h, s);

// Akıncı: firuze kaftan, sarık-miğfer, kırmızı tepelik, sırtında sadak, elinde yay
const akinciG = merge([
  P(BOX(.3, .42, .2), 0x3a2a1f, Mx(0, .21, 0)),
  P(CYL(.17, .27, .52, 7), 0x1aa3a8, Mx(0, .66, 0)),
  P(CYL(.215, .215, .07, 7), 0xe3a92b, Mx(0, .5, 0)),
  P(BOX(.38, .12, .22), 0x15727b, Mx(0, .88, 0)),
  P(SPH(.14, 7, 5), 0xe2b68c, Mx(0, 1.03, 0)),
  P(CYL(.18, .18, .07, 7), 0xf3ead6, Mx(0, 1.1, 0)),
  P(CONE(.17, .36, 7), 0xd5dbe0, Mx(0, 1.3, 0)),
  P(CONE(.035, .14, 4), 0xc8303a, Mx(0, 1.52, 0)),
  P(new THREE.TorusGeometry(.3, .025, 4, 10, Math.PI), 0x6b3e1f, Mx(-.27, .74, -.06, 1, 1, 1, 0, -Math.PI / 2, Math.PI / 2)),
  P(BOX(.012, .6, .012), 0xf2efe6, Mx(-.27, .74, -.06)),
  P(BOX(.1, .38, .1), 0x7a4a24, Mx(.09, .8, .17, 1, 1, 1, 0.3, 0, 0))
]);
// Bizans piyadesi: kızıl tunik, pullu zırh, tüylü miğfer, kalkan
function piyadeG(body = 0xb8323a, armor = 0x8e9aa3) {
  return merge([
    P(BOX(.3, .42, .2), 0x2a2226, Mx(0, .21, 0)),
    P(CYL(.18, .27, .52, 7), body, Mx(0, .66, 0)),
    P(BOX(.36, .3, .24), armor, Mx(0, .8, 0)),
    P(SPH(.14, 7, 5), 0xe0b08a, Mx(0, 1.03, 0)),
    P(new THREE.SphereGeometry(.17, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0x6f7880, Mx(0, 1.06, 0)),
    P(BOX(.03, .13, .28), 0xc8303a, Mx(0, 1.23, 0)),
    P(BOX(.07, .52, .4), 0x9b1f27, Mx(.3, .66, -.04)),
    P(SPH(.06, 6, 4), 0xe3a92b, Mx(.35, .66, -.04))
  ]);
}
const okcuG = merge([
  P(BOX(.28, .42, .2), 0x3a2d22, Mx(0, .21, 0)),
  P(CYL(.16, .25, .52, 7), 0x9e3a2e, Mx(0, .66, 0)),
  P(SPH(.14, 7, 5), 0xe0b08a, Mx(0, 1.03, 0)),
  P(CYL(.12, .17, .12, 7), 0x6b4a2b, Mx(0, 1.12, 0)),
  P(new THREE.TorusGeometry(.32, .025, 4, 10, Math.PI), 0x4a2a14, Mx(.25, .8, -.12, 1, 1, 1, 0, Math.PI / 2, Math.PI / 2)),
  P(BOX(.1, .4, .1), 0x5b3a1e, Mx(-.1, .82, .16, 1, 1, 1, .3, 0, 0))
]);
const varangG = merge([
  P(BOX(.34, .46, .22), 0x24262b, Mx(0, .23, 0)),
  P(CYL(.2, .3, .58, 8), 0x7a2030, Mx(0, .72, 0)),
  P(BOX(.42, .34, .28), 0x5c6670, Mx(0, .88, 0)),
  P(SPH(.15, 7, 5), 0xd9a882, Mx(0, 1.12, 0)),
  P(CONE(.19, .34, 8), 0x8d98a3, Mx(0, 1.33, 0)),
  P(BOX(.05, .1, .02), 0x8d98a3, Mx(0, 1.12, -.16)),
  P(BOX(.06, 1.1, .06), 0x5b3a1e, Mx(.36, .9, -.1)),
  P(BOX(.05, .3, .32), 0xb9c2cc, Mx(.36, 1.38, -.22))
]);
// Katafrakt: zırhlı at ve süvari
const katafraktG = merge([
  P(BOX(.46, .5, 1.2), 0x3b2a20, Mx(0, .95, 0)),
  P(BOX(.5, .36, 1.24), 0x8a949e, Mx(0, 1.02, 0)),
  ...[[-.16, .45], [.16, .45], [-.16, -.45], [.16, -.45]].map(([x, z]) => P(BOX(.12, .7, .12), 0x2b1f18, Mx(x, .35, z))),
  P(BOX(.24, .5, .3), 0x3b2a20, Mx(0, 1.35, -.62, 1, 1, 1, -.5, 0, 0)),
  P(BOX(.2, .22, .44), 0x8a949e, Mx(0, 1.58, -.8, 1, 1, 1, -.2, 0, 0)),
  P(CYL(.15, .2, .5, 7), 0x8e2a35, Mx(0, 1.55, .05)),
  P(BOX(.32, .26, .24), 0xaab3bb, Mx(0, 1.62, .05)),
  P(SPH(.13, 7, 5), 0xe0b08a, Mx(0, 1.9, .05)),
  P(CONE(.15, .3, 7), 0x8a949e, Mx(0, 2.08, .05)),
  P(BOX(.04, .04, 1.6), 0x6b4a2b, Mx(.24, 1.55, -.5)),
  P(CONE(.04, .18, 4), 0xd5dbe0, Mx(.24, 1.55, -1.38, 1, 1, 1, -Math.PI / 2, 0, 0))
]);
const FOE_GEO = { piyade: piyadeG(), okcu: okcuG, katafrakt: katafraktG, varang: varangG };

const armyMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const goldMat = new THREE.MeshPhongMaterial({ color: 0xe8b33a, specular: 0xfff2b0, shininess: 90, emissive: 0x3d2800 });
const dummy = new THREE.Object3D();
function inst(g, m, n) { const im = new THREE.InstancedMesh(g, m, n); im.castShadow = true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; scene.add(im); return im; }
const MAXC = 220, MAXE = 700, MAXA = 280;
const crowdMesh = inst(akinciG, armyMat, MAXC);
const heroMesh = inst(akinciG, goldMat, M.MAX_HERO);
const foeMesh = {}; for (const k in FOE_GEO) foeMesh[k] = inst(FOE_GEO[k], armyMat, MAXE);
const arrowMat = new THREE.MeshBasicMaterial({ color: M.WEAPONS[0].c });
const arrowMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(.07, .07, .8), arrowMat, MAXA); arrowMesh.frustumCulled = false; arrowMesh.count = 0; scene.add(arrowMesh);
const foeArrowMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(.06, .06, .7), new THREE.MeshBasicMaterial({ color: 0x6b1a14 }), 60); foeArrowMesh.frustumCulled = false; foeArrowMesh.count = 0; scene.add(foeArrowMesh);
const OFF = []; for (let i = 0; i < MAXC; i++) { const r = 0.34 * Math.sqrt(i), a = i * 2.39996; OFF.push({ x: Math.cos(a) * r * 0.85, z: Math.sin(a) * r * 1.15, ph: (i * 1.7) % 6.28 }); }

/* tuval dokuları */
function makeLabel(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; return { c, ctx: c.getContext('2d'), tex }; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawBig(L, text, fill = '#fff', stroke = '#16202e', size = 96) {
  const { ctx, c } = L; ctx.clearRect(0, 0, c.width, c.height); let s = size; ctx.font = `800 ${s}px ${FONT}`;
  while (ctx.measureText(text).width > c.width - 30 && s > 30) { s -= 6; ctx.font = `800 ${s}px ${FONT}`; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = stroke; ctx.strokeText(text, c.width / 2, c.height / 2 + 8); ctx.fillStyle = fill; ctx.fillText(text, c.width / 2, c.height / 2 + 8); L.tex.needsUpdate = true;
}
function drawCount(L, n) {
  const { ctx, c } = L; ctx.clearRect(0, 0, c.width, c.height); ctx.fillStyle = 'rgba(14,14,20,.86)'; rr(ctx, 8, 22, 240, 84, 20); ctx.fill();
  ctx.fillStyle = '#d8323c'; rr(ctx, 24, 44, 40, 40, 8); ctx.fill(); ctx.font = `800 62px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(fmt(n), 152, 70); L.tex.needsUpdate = true;
}
function drawBossBar(L, name, hp, max) {
  const { ctx, c } = L; ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = 'rgba(14,14,20,.88)'; rr(ctx, 6, 6, c.width - 12, c.height - 12, 22); ctx.fill();
  ctx.font = `800 40px ${FONT}`; ctx.fillStyle = '#ffd36b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, c.width / 2, 40);
  ctx.fillStyle = '#3a1418'; rr(ctx, 24, 70, c.width - 48, 34, 12); ctx.fill();
  ctx.fillStyle = '#e0343f'; rr(ctx, 24, 70, Math.max(0, (c.width - 48) * hp / max), 34, 12); ctx.fill();
  ctx.font = `800 28px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText(fmt(hp), c.width / 2, 89); L.tex.needsUpdate = true;
}
const texCache = {};
function cachedText(text) { if (!texCache[text]) { const L = makeLabel(256, 128); drawBig(L, text); texCache[text] = L.tex; } return texCache[text]; }
function tileTexture() {
  const L = makeLabel(256, 256), { ctx } = L; ctx.fillStyle = '#cbc5bb'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(${90 + Math.random() * 60 | 0},${85 + Math.random() * 50 | 0},${70 + Math.random() * 40 | 0},${Math.random() * 0.08})`; ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); }
  ctx.strokeStyle = 'rgba(120,112,100,.55)'; ctx.lineWidth = 3; for (let k = 0; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 128, 0); ctx.lineTo(k * 128, 256); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, k * 128); ctx.lineTo(256, k * 128); ctx.stroke(); }
  // Selçuklu yıldızı kakması
  ctx.save(); ctx.translate(128, 128); ctx.fillStyle = 'rgba(31,163,168,.22)';
  for (let r = 0; r < 2; r++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-26, -26, 52, 52); } ctx.restore();
  L.tex.wrapS = L.tex.wrapT = THREE.RepeatWrapping; L.tex.generateMipmaps = true; L.tex.minFilter = THREE.LinearMipmapLinearFilter; L.tex.anisotropy = 4; L.tex.needsUpdate = true; return L.tex;
}
function glowTexture() { const L = makeLabel(128, 128), { ctx } = L; const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,170,1)'); g.addColorStop(.35, 'rgba(255,200,80,.6)'); g.addColorStop(1, 'rgba(255,180,40,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); L.tex.needsUpdate = true; return L.tex; }
function puffTexture() { const L = makeLabel(64, 64), { ctx } = L; const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(255,250,235,.95)'); g.addColorStop(1, 'rgba(230,210,170,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); L.tex.needsUpdate = true; return L.tex; }
const roadTex = tileTexture(), glowTex = glowTexture(), puffTex = puffTexture();
// sancak dokusu: firuze zemin, altın hilal
function flagTexture(bg, fg) { const L = makeLabel(128, 192), { ctx } = L; ctx.fillStyle = bg; ctx.fillRect(0, 0, 128, 192); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(60, 80, 36, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(74, 74, 31, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = fg; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, 150 + i * 14); ctx.lineTo(128, 150 + i * 14); ctx.lineTo(128, 156 + i * 14); ctx.lineTo(0, 156 + i * 14); ctx.fill(); } L.tex.needsUpdate = true; return L.tex; }
const flagTex = flagTexture('#1fa3a8', '#f0b232'), flagTexRed = flagTexture('#8e1f2a', '#e7c56a');

/* ================= DÜNYA ================= */
const world = new THREE.Group(); scene.add(world);
const levelGroup = new THREE.Group(); scene.add(levelGroup);
let curTheme = -1;
function buildWorld(ti) {
  if (ti === curTheme) return; curTheme = ti;
  while (world.children.length) { const c = world.children.pop(); if (c.geometry) c.geometry.dispose(); }
  const T = THEMES[ti];
  scene.background.set(T.sky); scene.fog.color.set(T.sky); sun.color.set(T.sun); hemi.groundColor.set(T.hemiG);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 1600), new THREE.MeshLambertMaterial({ color: T.ground }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, -650); world.add(ground);
  if (T.lake) { const lake = new THREE.Mesh(new THREE.PlaneGeometry(260, 1500), new THREE.MeshPhongMaterial({ color: T.lake, shininess: 80, specular: 0x9fd8ff })); lake.rotation.x = -Math.PI / 2; lake.position.set(-170, 0, -650); world.add(lake); }
  if (T.river) { const riv = new THREE.Mesh(new THREE.PlaneGeometry(14, 1500), new THREE.MeshPhongMaterial({ color: T.river, shininess: 60 })); riv.rotation.x = -Math.PI / 2; riv.position.set(24, 0, -650); world.add(riv); }
  const rnd = mulberry(42 + ti * 11);
  const hillGeo = SPH(1, 12, 8);
  for (let i = 0; i < 70; i++) {
    const side = rnd() < .5 ? -1 : 1; if (T.lake && side < 0 && rnd() < .8) continue; const r = 8 + rnd() * 22;
    const h = new THREE.Mesh(hillGeo, new THREE.MeshLambertMaterial({ color: T.hill[i % 4] })); h.scale.set(r, r * (0.18 + rnd() * 0.22), r * (0.8 + rnd() * 0.6)); h.position.set(side * (30 + rnd() * 120), 0, 40 - rnd() * 1300); world.add(h);
  }
  const mtGeo = CONE(1, 1, 6);
  for (let i = 0; i < 26; i++) { const side = rnd() < .5 ? -1 : 1; const r = 40 + rnd() * 50; const m = new THREE.Mesh(mtGeo, new THREE.MeshLambertMaterial({ color: T.mt })); m.scale.set(r, r * (0.5 + rnd() * 0.6), r); m.position.set(side * (160 + rnd() * 160), 0, -100 - rnd() * 1300); world.add(m); }
  const bush = new THREE.InstancedMesh(SPH(.6, 6, 4), new THREE.MeshLambertMaterial({ color: T.bush }), 220);
  for (let i = 0; i < 220; i++) { const side = rnd() < .5 ? -1 : 1; dummy.position.set(side * (8 + rnd() * 26), 0.15, 30 - rnd() * 1300); const s = 0.5 + rnd() * 1.1; dummy.scale.set(s * 1.3, s * 0.6, s); dummy.rotation.set(0, rnd() * 6, 0); dummy.updateMatrix(); bush.setMatrixAt(i, dummy.matrix); }
  world.add(bush); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0);
}
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const blockGeo = BOX(1.6, 1.1, 1.0), blockMat = new THREE.MeshLambertMaterial({ color: 0x1fa3a8 }), blockTopMat = new THREE.MeshLambertMaterial({ color: 0x5fd0d4 });
const pedGeo = BOX(2.4, 1.5, 1.5), pedMat = new THREE.MeshLambertMaterial({ color: 0x3f4756 });
const postGeo = CYL(.16, .2, 3.2, 8), postMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2b }), capGeo = SPH(.26, 8, 6);
const capMat = new THREE.MeshPhongMaterial({ color: 0xe8b33a, specular: 0xfff2b0, shininess: 80 });
const hilalGeo = new THREE.TorusGeometry(.32, .07, 6, 14, Math.PI * 1.35);
const stoneMat = new THREE.MeshLambertMaterial({ color: 0x9c8b74 }), stoneDark = new THREE.MeshLambertMaterial({ color: 0x857560 });
const woodMat = new THREE.MeshLambertMaterial({ color: 0x7a5232 }), stakeGeo = CONE(.13, 1.5, 5);

function labelPlane(L, w, h) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: L.tex, transparent: true, depthWrite: false })); }
function labelSprite(L, sx, sy) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: L.tex, transparent: true, depthWrite: false })); s.scale.set(sx, sy, 1); s.renderOrder = 5; return s; }
function hilalPost(x) {
  const g = new THREE.Group(); const p = new THREE.Mesh(postGeo, postMat); p.position.y = 1.6; p.castShadow = true; g.add(p);
  const c = new THREE.Mesh(capGeo, capMat); c.position.y = 3.3; g.add(c);
  const h = new THREE.Mesh(hilalGeo, capMat); h.position.y = 3.85; h.rotation.z = Math.PI * 0.82; g.add(h);
  g.position.x = x; return g;
}

const VIEW = { objs: new Map(), gates: [] };
function buildLevelView(G) {
  while (levelGroup.children.length) levelGroup.remove(levelGroup.children[0]);
  VIEW.objs.clear(); VIEW.gates = [];
  buildWorld(G.L.reg);
  for (const o of G.objs) {
    if (o.t === 'block') {
      const g = new THREE.Group(); const b = new THREE.Mesh(blockGeo, blockMat); b.position.y = .55; b.castShadow = true; b.receiveShadow = true; g.add(b);
      const top = new THREE.Mesh(BOX(1.62, .12, 1.02), blockTopMat); top.position.y = 1.1; g.add(top);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .7), new THREE.MeshBasicMaterial({ map: cachedText('+' + o.reward), transparent: true, depthWrite: false })); lab.position.set(0, .6, .51); g.add(lab);
      g.position.set(o.x, 0, o.z); levelGroup.add(g); VIEW.objs.set(o, { g });
    } else if (o.t === 'pedestal') {
      const g = new THREE.Group(); const b = new THREE.Mesh(pedGeo, pedMat); b.position.y = .75; b.castShadow = true; b.receiveShadow = true; g.add(b);
      const L = makeLabel(256, 128); drawBig(L, fmt(o.hp)); const lab = labelPlane(L, 2.0, 1.0); lab.position.set(0, .72, .76); g.add(lab);
      const item = new THREE.Group(); item.position.y = 1.5; g.add(item);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 })); glow.scale.set(3.2, 3.2, 1); glow.position.y = o.kind === 'hero' ? 1.6 : 1.0; item.add(glow);
      if (o.kind === 'hero') { const s = new THREE.Mesh(akinciG, goldMat); s.scale.set(2.1, 2.1, 2.1); s.rotation.y = Math.PI; s.castShadow = true; item.add(s); }
      else if (o.kind === 'weapon') {
        const bow = new THREE.Group(); const arc = new THREE.Mesh(new THREE.TorusGeometry(.6, .07, 6, 16, Math.PI), capMat); arc.rotation.z = Math.PI / 2; bow.add(arc);
        bow.add(new THREE.Mesh(BOX(.03, 1.2, .03), new THREE.MeshBasicMaterial({ color: 0xfff6d8 })));
        const ar = new THREE.Mesh(BOX(1.3, .06, .06), new THREE.MeshBasicMaterial({ color: M.WEAPONS[Math.min(o.val, 4)].c })); ar.position.x = -.2; bow.add(ar); bow.position.y = 1.0; item.add(bow);
      } else {
        const pole = new THREE.Mesh(CYL(.06, .06, 2.4, 6), postMat); pole.position.y = 1.2; item.add(pole);
        const hair = new THREE.Mesh(CONE(.35, 1.0, 8), new THREE.MeshLambertMaterial({ color: 0x2a1a12 })); hair.position.y = 2.0; hair.rotation.x = Math.PI; item.add(hair);
        const h = new THREE.Mesh(hilalGeo, capMat); h.position.y = 2.7; h.rotation.z = Math.PI * 0.82; item.add(h);
      }
      g.position.set(o.x, 0, o.z); levelGroup.add(g); VIEW.objs.set(o, { g, L, item, shown: o.hp });
    } else if (o.t === 'barricade') {
      const g = new THREE.Group(); const beam = new THREE.Mesh(BOX(o.w, .35, .35), woodMat); beam.position.y = .5; beam.castShadow = true; g.add(beam);
      for (let x = -o.w / 2 + .3; x <= o.w / 2 - .2; x += .55) {
        const a = new THREE.Mesh(stakeGeo, woodMat); a.position.set(x, .7, -.1); a.rotation.x = -1.0; a.castShadow = true; g.add(a);
        const b = new THREE.Mesh(stakeGeo, woodMat); b.position.set(x + .27, .7, .1); b.rotation.x = 1.0; g.add(b);
      }
      const L = makeLabel(256, 128); drawBig(L, fmt(o.hp), '#ffd9a0'); const lab = labelSprite(L, 2.2, 1.1); lab.position.set(0, 2.2, 0); g.add(lab);
      g.position.set(o.x, 0, o.z); levelGroup.add(g); VIEW.objs.set(o, { g, L, shown: o.hp });
    } else if (o.t === 'squad') {
      const L = makeLabel(256, 128); drawCount(L, o.n); const spr = labelSprite(L, o.final ? 3.2 : 2.4, o.final ? 1.6 : 1.2); levelGroup.add(spr);
      VIEW.objs.set(o, { spr, L, shown: o.n, seed: Math.random() * 100 });
    } else if (o.t === 'boss') {
      const B = M.BOSSES[o.id];
      const geo = B.tip === 'katafrakt' ? katafraktG : B.tip === 'varang' ? varangG : piyadeG(B.renk, 0xc9a24a);
      const m = new THREE.Mesh(geo, armyMat); const sc = B.tip === 'katafrakt' ? 2.6 : 3.4; m.scale.set(sc, sc, sc); m.rotation.y = Math.PI; m.castShadow = true;
      const g = new THREE.Group(); g.add(m);
      const crown = new THREE.Mesh(CYL(.5, .4, .3, 8), capMat); crown.position.y = (B.tip === 'katafrakt' ? 2.3 : 1.55) * sc; g.add(crown);
      const L = makeLabel(512, 128); drawBossBar(L, B.ad, o.hp, o.max); const spr = labelSprite(L, 5.2, 1.3); spr.position.y = (B.tip === 'katafrakt' ? 2.3 : 1.6) * sc + 1.6; g.add(spr);
      g.position.set(o.x, 0, o.z); levelGroup.add(g); VIEW.objs.set(o, { g, L, shown: o.hp, m, base: sc });
    }
  }
  for (const gt of G.gates) {
    const g = new THREE.Group(); const panels = [];
    [[gt.L, -3], [gt.R, 3]].forEach(([op, x]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.6), new THREE.MeshBasicMaterial({ map: gateTex(op), transparent: true, depthWrite: false, side: THREE.DoubleSide })); p.position.set(x, 1.7, 0); g.add(p); panels.push(p); });
    [-6, 0, 6].forEach(x => g.add(hilalPost(x)));
    g.position.z = gt.z; levelGroup.add(g); VIEW.gates.push({ gt, panels, anim: -1, t: 0 });
  }
  // Bizans kalesi (bölüm sonu)
  const fz = G.L.endZ - 12, f = new THREE.Group();
  const wall = new THREE.Mesh(BOX(34, 6, 2.2), stoneMat); wall.position.y = 3; wall.castShadow = true; wall.receiveShadow = true; f.add(wall);
  const cg = BOX(.8, .8, 2.3); for (let x = -16.5; x <= 16.6; x += 1.5) { const c = new THREE.Mesh(cg, stoneMat); c.position.set(x, 6.4, 0); f.add(c); }
  [-8, 8].forEach(x => { const t = new THREE.Mesh(CYL(2.4, 2.6, 9, 10), stoneDark); t.position.set(x, 4.5, 0); t.castShadow = true; f.add(t); for (let a = 0; a < 10; a++) { const c = new THREE.Mesh(BOX(.7, .8, .7), stoneDark); const an = a / 10 * Math.PI * 2; c.position.set(x + Math.cos(an) * 2.2, 9.4, Math.sin(an) * 2.2); f.add(c); } });
  const gate = new THREE.Mesh(BOX(4.4, 4.4, .3), new THREE.MeshLambertMaterial({ color: 0x3a2a20 })); gate.position.set(0, 2.2, 1.15); f.add(gate);
  const banners = [];[-4, 4, -12.5, 12.5].forEach(x => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshLambertMaterial({ map: flagTexRed, side: THREE.DoubleSide })); b.position.set(x, 4.2, 1.15); f.add(b); banners.push(b); });
  f.position.z = fz; levelGroup.add(f); VIEW.fort = { gate, banners };
  // yol ve kenar taşları
  const len = G.L.len + 60, cz = 20 - len / 2;
  roadTex.repeat.set(3, len / 4);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(M.ROAD * 2, len), new THREE.MeshLambertMaterial({ map: roadTex })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, cz); road.receiveShadow = true; levelGroup.add(road);
  [-1, 1].forEach(s => { const w = new THREE.Mesh(BOX(.6, .7, len), stoneMat); w.position.set(s * (M.ROAD + .3), .35, cz); w.receiveShadow = true; levelGroup.add(w); });
  // yol boyu sancaklar
  for (let z = -10; z > G.L.endZ; z -= 40) [-1, 1].forEach(s => { const p = new THREE.Group(); const pole = new THREE.Mesh(CYL(.07, .07, 4, 6), postMat); pole.position.y = 2; p.add(pole); const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), new THREE.MeshLambertMaterial({ map: flagTex, side: THREE.DoubleSide })); fl.position.set(s * -.6, 3.1, 0); p.add(fl); p.position.set(s * (M.ROAD + 1.4), 0, z); levelGroup.add(p); });
  arrowMat.color.set(M.WEAPONS[0].c);
}
const SYM = { '+': '+', 'x': '×', '-': '−', '/': '÷' };
const gateCache = {};
function gateTex(o) {
  const key = o.op + o.v; if (gateCache[key]) return gateCache[key];
  const good = o.op === '+' || o.op === 'x'; const L = makeLabel(256, 128), { ctx } = L;
  ctx.fillStyle = good ? 'rgba(31,163,168,0.62)' : 'rgba(200,48,58,0.62)'; rr(ctx, 4, 4, 248, 120, 16); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.85)'; rr(ctx, 6, 6, 244, 116, 14); ctx.stroke();
  ctx.font = `800 84px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(16,32,46,.75)'; const t = SYM[o.op] + o.v; ctx.strokeText(t, 128, 72); ctx.fillStyle = '#fff'; ctx.fillText(t, 128, 72); L.tex.needsUpdate = true;
  return gateCache[key] = L.tex;
}

/* toz bulutları */
const puffs = []; for (let i = 0; i < 70; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; scene.add(s); puffs.push({ s, life: 0, size: 1 }); }
let puffI = 0;
function puff(x, y, z, size = 1.2) { const p = puffs[puffI++ % puffs.length]; p.s.position.set(x, y, z); p.life = 0.45; p.size = size; p.s.visible = true; }

/* ================= EKRAN YARDIMCILARI ================= */
const pops = $('pops'); const _v = new THREE.Vector3();
function toScreen(x, y, z) { _v.set(x, y, z).project(camera); return { x: (_v.x * 0.5 + 0.5) * window.innerWidth, y: (-_v.y * 0.5 + 0.5) * window.innerHeight, vis: _v.z < 1 }; }
function popup(text, x, y, z, cls = '') { const p = toScreen(x, y, z); const d = document.createElement('div'); d.className = 'pop ' + cls; d.textContent = text; d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; pops.appendChild(d); setTimeout(() => d.remove(), 1150); }
function banner(text, sub) { const old = $('banner'); if (old) old.remove(); const d = document.createElement('div'); d.id = 'banner'; d.innerHTML = text + (sub ? '<small>' + sub + '</small>' : ''); document.body.appendChild(d); setTimeout(() => d.remove(), 2300); }
const starHtml = (n, total = 3) => { let s = ''; for (let k = 0; k < total; k++) s += '<i class="star' + (k < n ? '' : ' off') + '" style="animation-delay:' + (0.25 + k * 0.25) + 's"></i>'; return s; };

/* ================= OYUN DURUMU ================= */
let G = null, mode = 'menu', paused = false, hintT = 0, camX = 0, camZ = 0, lastRes = null, firstWin = false;
function startGame(i) {
  G = M.newGame(i, S.up); buildLevelView(G); camX = 0; camZ = 0;
  mode = 'play'; paused = false; hintT = i === 0 ? 3.2 : 0;
  show(null); $('hLvl').textContent = 'Bölüm ' + (i + 1); updateWeapon();
  drumOn = true; drumT = 0.3; unlockAudio();
  banner(G.L.ad, M.REGIONS[G.L.reg].ad);
}
function previewLevel(i) { G = M.newGame(i, S.up); buildLevelView(G); camX = 0; camZ = 0; mode = 'menu'; drumOn = false; }
function updateWeapon() { const w = M.WEAPONS[G.wTier]; $('weapon').innerHTML = w.ad + '<small>×' + String(w.m).replace('.', ',') + '</small>'; arrowMat.color.set(w.c); }

/* girdi: parmağını kaydır */
let drag = false, lx = 0, keyDir = 0;
window.addEventListener('pointerdown', e => { unlockAudio(); if (mode !== 'play' || paused) return; drag = true; lx = e.clientX; });
window.addEventListener('pointermove', e => { if (!drag || !G) return; const dx = e.clientX - lx; lx = e.clientX; G.tx += dx / Math.min(window.innerWidth, 520) * 13; });
['pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, () => drag = false));
window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'a') keyDir = -1; if (e.key === 'ArrowRight' || e.key === 'd') keyDir = 1; if (e.key === 'Escape' && mode === 'play') pause(true); });
window.addEventListener('keyup', e => { if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) keyDir = 0; });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && !paused) pause(true); });

function handleEvents() {
  for (const e of G.events) {
    switch (e.type) {
      case 'gain': popup('+' + e.v, e.x, 1.8, e.z); SFX.gain(); break;
      case 'gate': { popup((e.d >= 0 ? '+' : '') + e.d, e.x, 2.5, e.z - 1, e.d >= 0 ? '' : 'bad'); e.d >= 0 ? SFX.good() : SFX.bad(); const v = VIEW.gates.find(v => v.gt === e.g); if (v) { v.anim = e.g.side < 0 ? 0 : 1; v.t = 0; } break; }
      case 'weapon': popup(M.WEAPONS[e.w].ad + '!', e.x, 3, e.z, 'gold'); SFX.weapon(); updateWeapon(); break;
      case 'hero': popup('Altın Alp katıldı!', e.x, 3.2, e.z, 'gold'); SFX.hero(); break;
      case 'troops': popup('+' + e.v + ' akıncı', e.x, 3, e.z, 'gold'); SFX.good(); break;
      case 'crash': popup('−' + e.v, e.x, 2.4, e.z, 'bad'); SFX.crash(); if (navigator.vibrate) try { navigator.vibrate(30); } catch (x) {} break;
      case 'break': { const v = VIEW.objs.get(e.o); if (v) v.die = 0.3; puff(e.o.x, 1, e.o.z, 2.4); puff(e.o.x + .6, 1.4, e.o.z, 1.8); SFX.break(); break; }
      case 'hit': SFX.tick(); if (Math.random() < .4) puff(e.x + (Math.random() - .5) * 2, .8, e.z, .9); break;
      case 'clash': SFX.tick(); if (Math.random() < .5) puff(e.x + (Math.random() - .5) * 2.5, .9, e.z, 1.4); break;
      case 'bossHit': if (Math.random() < .3) { puff(e.x + (Math.random() - .5) * 2, 1, e.z, 1.6); noise(0.1, 0.06, 600); } break;
      case 'win': VIEW.fort.banners.forEach(b => { b.material.map = flagTex; b.material.needsUpdate = true; }); VIEW.fort.gate.visible = false; davul(0, true); break;
    }
  }
}

function finish(win) {
  mode = 'over'; drumOn = false;
  const i = G.i, before = S.stars[i] || 0;
  firstWin = win && !before;
  const gain = M.rewardOf(G, win, firstWin);
  S.coins += gain;
  let stars = 0;
  if (win) { stars = M.starsOf(G); S.stars[i] = Math.max(before, stars); if (S.unlocked < i + 2) S.unlocked = Math.min(NL, i + 2); }
  persist();
  lastRes = { i, win, stars, gain };
  if (win) {
    const last = i === NL - 1;
    $('wTitle').textContent = last ? 'MALAZGİRT!' : 'ZAFER!';
    $('wStars').innerHTML = starHtml(stars);
    $('wStats').innerHTML = (last ? '' : G.L.ad + ' geçildi.<br>') + 'Sağ kalan akıncı: <b>' + G.count + '</b>' + (G.heroes ? ' · Altın Alp: <b>' + G.heroes + '</b>' : '') + '<br>Dağıtılan Bizans askeri: <b>' + fmt(G.kills) + '</b>';
    $('wEpi').hidden = !last;
    if (last) $('wEpi').textContent = '26 Ağustos 1071. Bizans ordusu dağıldı, İmparator Romen Diyojen esir düştü. Sultan Alparslan onu bağışlayıp serbest bıraktı. Anadolu\'nun kapıları açıldı.';
    $('wGain').textContent = gain;
    $('wNext').textContent = last ? 'SEFER HARİTASI' : 'DEVAM';
    show('win'); fanfare(); for (let k = 0; k < stars; k++) setTimeout(() => SFX.star(k), 300 + k * 250);
  } else {
    let tip;
    if (G.wTier === 0 && G.L.objs.some(o => o.t === 'pedestal')) tip = 'Kaideleri okla sıfırla: daha güçlü bir yay, ordunun gücünü katlar.';
    else if (G.peak < 30) tip = 'Kapılarda doğru tarafı seç. Ordun büyük olmadan bölüm sonuna varma.';
    else if (G.L.boss) tip = 'Dev, ok gücünle eriyor. Ordugâh\'ta Ok Ucu ve Kemankeşhane\'yi geliştir.';
    else tip = 'Ordugâh\'ta akıncılarını güçlendir ya da eski bölümleri yıldızlayıp akçe topla.';
    $('lTip').textContent = tip; $('lGain').textContent = gain;
    show('lose'); sadHorn();
  }
}

/* ================= EKRANLAR ================= */
const SCR = { menu: 'scrMenu', levels: 'scrLevels', camp: 'scrCamp', brief: 'scrBrief', pause: 'scrPause', win: 'scrWin', lose: 'scrLose' };
function show(n) {
  for (const k in SCR) $(SCR[k]).hidden = k !== n;
  const playing = n === null || n === 'pause';
  $('hud').hidden = !playing; $('weapon').hidden = !playing; $('sndBtn').hidden = !(n === 'menu' || n === 'pause');
  if (n === 'menu') renderMenu(); if (n === 'levels') renderLevels(); if (n === 'camp') renderCamp();
}
const nextLevel = () => Math.min(NL - 1, S.unlocked - 1);
function renderMenu() {
  const i = nextLevel(); $('mCoins').textContent = S.coins; $('mStars').textContent = totalStars() + ' / ' + NL * 3 + ' yıldız';
  $('bPlaySub').textContent = 'Bölüm ' + (i + 1) + ' · ' + M.LEVELS[i].ad;
}
let regionSel = -1;
function renderLevels() {
  if (regionSel < 0) regionSel = Math.floor(nextLevel() / 10);
  $('lStars').textContent = totalStars() + ' / ' + NL * 3;
  const tabs = $('tabs'); tabs.innerHTML = '';
  M.REGIONS.forEach((R, r) => {
    const lock = r * 10 + 1 > S.unlocked; let st = 0; for (let k = 0; k < 10; k++) st += S.stars[r * 10 + k] || 0;
    const b = document.createElement('button'); b.className = 'tab' + (lock ? ' locked' : ''); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', r === regionSel);
    b.innerHTML = R.ad + '<small>' + (lock ? 'Kilitli' : st + ' / 30 yıldız') + '</small>';
    b.addEventListener('click', () => { SFX.click(); regionSel = r; renderLevels(); });
    tabs.appendChild(b);
  });
  $('regionHead').textContent = M.REGIONS[regionSel].alt;
  const grid = $('grid'); grid.innerHTML = '';
  for (let k = 0; k < 10; k++) {
    const i = regionSel * 10 + k, L = M.LEVELS[i], lock = i + 1 > S.unlocked;
    const b = document.createElement('button'); b.className = 'lv' + (lock ? ' lock' : '') + (i === nextLevel() && !lock ? ' cur' : '');
    let inner = '';
    if (L.boss) { const bo = L.objs.find(o => o.t === 'boss'); inner += '<span class="tag">' + M.BOSSES[bo.id].ad.toLocaleUpperCase('tr') + '</span>'; }
    inner += '<span class="n">' + (lock ? '<svg width="22" height="26" viewBox="0 0 22 26" aria-label="kilitli"><rect x="2" y="11" width="18" height="14" rx="3" fill="currentColor"/><path d="M6 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="3" fill="none"/></svg>' : (i + 1)) + '</span><span class="nm">' + L.ad + '</span><span class="st">' + starHtml(S.stars[i] || 0).replace(/ style="[^"]*"/g, '') + '</span>';
    b.innerHTML = inner; b.disabled = lock; b.setAttribute('aria-label', 'Bölüm ' + (i + 1) + ', ' + L.ad + (lock ? ', kilitli' : ''));
    if (!lock) b.addEventListener('click', () => { SFX.click(); openBrief(i); });
    grid.appendChild(b);
  }
}
function renderCamp() {
  $('cCoins').textContent = S.coins;
  const camp = $('camp'); camp.innerHTML = '';
  M.UPG.forEach(u => {
    const l = S.up[u.k], max = l >= M.UPMAX, cost = max ? 0 : M.upCost(u, l);
    const card = document.createElement('div'); card.className = 'card';
    let pips = ''; for (let k = 0; k < M.UPMAX; k++) pips += '<i' + (k < l ? ' class="on"' : '') + '></i>';
    card.innerHTML = '<h3>' + u.ad + '</h3><div class="lvl">SEVİYE ' + l + ' / ' + M.UPMAX + '</div><div class="pips">' + pips + '</div><div class="d">' + u.desc(l) + (max ? '' : '<br><b>Sonraki: ' + u.desc(l + 1) + '</b>') + '</div>';
    const b = document.createElement('button'); b.className = 'buy'; b.disabled = max || S.coins < cost;
    b.innerHTML = max ? 'EN ÜST SEVİYE' : '<b class="akce"></b>' + cost; b.setAttribute('aria-label', max ? u.ad + ' en üst seviyede' : u.ad + ' geliştir, ' + cost + ' akçe');
    b.addEventListener('click', () => { if (max || S.coins < cost) return; S.coins -= cost; S.up[u.k]++; persist(); SFX.buy(); renderCamp(); if (mode === 'menu') previewLevel(nextLevel()); });
    card.appendChild(b); camp.appendChild(card);
  });
}
let briefI = 0;
function openBrief(i) {
  briefI = i; const L = M.LEVELS[i], R = M.REGIONS[L.reg];
  $('scrBrief').querySelector('.topbar h2').textContent = 'Bölüm ' + (i + 1) + ' / ' + NL;
  $('brReg').textContent = R.ad + ' · ' + R.alt; $('brName').textContent = L.ad; $('brText').textContent = L.brief;
  $('brStars').innerHTML = starHtml(S.stars[i] || 0).replace(/ style="[^"]*"/g, '');
  const kinds = new Set(); let boss = null; L.objs.forEach(o => { if (o.t === 'squad') kinds.add(o.ft); if (o.t === 'boss') boss = o; });
  let chips = ''; kinds.forEach(k => chips += '<span class="chip">' + M.FOES[k].ad + '</span>'); if (boss) chips += '<span class="chip boss">' + M.BOSSES[boss.id].ad + '</span>';
  $('brFoes').innerHTML = chips;
  previewLevel(i); show('brief');
}
function pause(on) { if (mode !== 'play') return; paused = on; drag = false; show(on ? 'pause' : null); drumOn = !on; }

document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { SFX.click(); const g = b.dataset.go; if (g === 'menu') { previewLevel(nextLevel()); } show(g); }));
$('bPlay').addEventListener('click', () => { unlockAudio(); SFX.click(); openBrief(nextLevel()); });
$('bLevels').addEventListener('click', () => { SFX.click(); regionSel = -1; show('levels'); });
$('bCamp').addEventListener('click', () => { SFX.click(); show('camp'); });
$('bStart').addEventListener('click', () => { unlockAudio(); startGame(briefI); });
$('pauseBtn').addEventListener('click', () => { SFX.click(); pause(true); });
$('pResume').addEventListener('click', () => { SFX.click(); pause(false); });
$('pRestart').addEventListener('click', () => { SFX.click(); startGame(G.i); });
$('pMenu').addEventListener('click', () => { SFX.click(); previewLevel(nextLevel()); show('menu'); });
$('wNext').addEventListener('click', () => { SFX.click(); if (lastRes.i >= NL - 1) { regionSel = 4; show('levels'); } else openBrief(lastRes.i + 1); });
$('wRetry').addEventListener('click', () => { SFX.click(); startGame(lastRes.i); });
$('wMenu').addEventListener('click', () => { SFX.click(); previewLevel(nextLevel()); show('menu'); });
$('lRetry').addEventListener('click', () => { SFX.click(); startGame(lastRes.i); });
$('lCamp').addEventListener('click', () => { SFX.click(); previewLevel(lastRes.i); show('camp'); });
$('lMenu').addEventListener('click', () => { SFX.click(); previewLevel(nextLevel()); show('menu'); });

/* ================= ÇİZİM ================= */
function renderCrowd(t) {
  const m = Math.min(G.count, MAXC), moving = mode === 'play' && !paused || G.state === 'march';
  for (let i = 0; i < m; i++) {
    const o = OFF[i]; const bob = moving ? Math.abs(Math.sin(t * 11 + o.ph)) * 0.12 : Math.sin(t * 2 + o.ph) * 0.02;
    dummy.position.set(G.x + o.x, bob, G.z + o.z); dummy.rotation.set(moving ? -0.1 : 0, 0, moving ? Math.sin(t * 11 + o.ph) * 0.06 : 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); crowdMesh.setMatrixAt(i, dummy.matrix);
  }
  crowdMesh.count = m; crowdMesh.instanceMatrix.needsUpdate = true;
  const h = G.heroes; for (let i = 0; i < h; i++) { dummy.position.set(G.x + (i - (h - 1) / 2) * 1.4, moving ? Math.abs(Math.sin(t * 8 + i)) * 0.15 : 0, G.z - G.Rz - 1.0); dummy.rotation.set(0, 0, 0); dummy.scale.set(2, 2, 2); dummy.updateMatrix(); heroMesh.setMatrixAt(i, dummy.matrix); }
  heroMesh.count = h; heroMesh.instanceMatrix.needsUpdate = true; dummy.scale.set(1, 1, 1);
}
function renderFoes(t) {
  const idx = { piyade: 0, okcu: 0, katafrakt: 0, varang: 0 };
  for (const o of G.objs) {
    if (o.t !== 'squad') continue; const v = VIEW.objs.get(o);
    if (!o.alive || o.z < G.z - 110 || o.z > G.z + 14) { v.spr.visible = false; continue; }
    if (!o.cols) { o.cols = 1; o.rows = 1; o.w = 1; o.d = 1; }
    const cap = o.ft === 'katafrakt' ? 90 : 160, m = Math.min(o.n, cap), mesh = foeMesh[o.ft];
    const sx = o.ft === 'katafrakt' ? 0.8 : 0.55, sz = o.ft === 'katafrakt' ? 1.1 : 0.6;
    const cols = Math.max(1, Math.min(o.ft === 'katafrakt' ? 8 : 12, Math.ceil(Math.sqrt(m * 1.3)))), rows = Math.ceil(m / cols);
    const moving = M.FOES[o.ft].v > 0 && (G.z - o.z) < 42;
    for (let j = 0; j < m && idx[o.ft] < MAXE; j++) {
      const r = Math.floor(j / cols), c = j % cols; const jx = Math.sin(j * 12.9898 + v.seed) * 0.12, jz = Math.cos(j * 78.233 + v.seed) * 0.12;
      dummy.position.set(o.x + (c - (cols - 1) / 2) * sx + jx, moving ? Math.abs(Math.sin(t * 10 + j)) * 0.1 : 0, o.z + (r - (rows - 1) / 2) * sz + jz); dummy.rotation.set(0, Math.PI, 0); dummy.updateMatrix(); mesh.setMatrixAt(idx[o.ft]++, dummy.matrix);
    }
    v.spr.visible = true; v.spr.position.set(o.x, o.ft === 'katafrakt' ? 3.3 : 2.5, o.z + rows * sz / 2);
    if (o.n !== v.shown) { v.shown = o.n; drawCount(v.L, o.n); }
  }
  for (const k in foeMesh) { foeMesh[k].count = idx[k]; foeMesh[k].instanceMatrix.needsUpdate = true; }
}
function renderArrows() {
  let i = 0; for (const a of G.arrows) { if (i >= MAXA) break; dummy.position.set(a.x, a.y, a.z); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); arrowMesh.setMatrixAt(i++, dummy.matrix); }
  arrowMesh.count = i; arrowMesh.instanceMatrix.needsUpdate = true;
  let j = 0; for (const s of G.foeShots) { if (j >= 60) break; const x = s.x + (s.tx - s.x) * s.t, z = s.z + (s.tz - s.z) * s.t, y = 1 + Math.sin(s.t * Math.PI) * 3;
    dummy.position.set(x, y, z); dummy.rotation.set(Math.cos(s.t * Math.PI) * -0.9, 0, 0); dummy.updateMatrix(); foeArrowMesh.setMatrixAt(j++, dummy.matrix); }
  foeArrowMesh.count = j; foeArrowMesh.instanceMatrix.needsUpdate = true;
}
function renderObjs(dt, t) {
  for (const [o, v] of VIEW.objs) {
    if (o.t === 'squad') continue;
    if (o.alive) {
      if (v.L && Math.ceil(o.hp) !== v.shown) { v.shown = Math.ceil(o.hp); if (o.t === 'boss') drawBossBar(v.L, M.BOSSES[o.id].ad, o.hp, o.max); else drawBig(v.L, fmt(o.hp), o.t === 'barricade' ? '#ffd9a0' : '#fff'); }
      const s = 1 + o.flash * 1.2; v.g.scale.set(s, s, s);
      if (v.item) v.item.rotation.y += dt * 1.6;
      if (o.t === 'boss') { v.g.position.z = o.z; v.m.rotation.z = Math.sin(t * 6) * 0.04; }
    } else if (v.die !== undefined && v.die > 0) { v.die -= dt; const s = Math.max(0.01, v.die / 0.3); v.g.scale.set(s, s, s); if (v.die <= 0) v.g.visible = false; }
    else if (v.g && !o.alive && v.die === undefined) v.g.visible = false;
  }
  for (const gv of VIEW.gates) if (gv.anim >= 0 && gv.t < 1) { gv.t = Math.min(1, gv.t + dt * 3); const p = gv.panels[gv.anim]; p.scale.set(1 + gv.t * .3, Math.max(.01, 1 - gv.t), 1); p.material.opacity = 1 - gv.t; }
  for (const p of puffs) if (p.life > 0) { p.life -= dt; const k = 1 - p.life / 0.45; p.s.scale.setScalar(p.size * (0.6 + k * 1.2)); p.s.material.opacity = Math.max(0, 0.85 * (1 - k)); p.s.position.y += dt * 1.2; if (p.life <= 0) p.s.visible = false; }
}

let last = performance.now(), T = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  if (G) {
    if (mode === 'play' && !paused) {
      G.tx += keyDir * 12 * dt;
      M.step(G, dt); handleEvents(); drumLoop(dt);
      if (hintT > 0) { hintT -= dt; } $('hint').hidden = !(hintT > 0);
      if (G.state === 'win' && mode === 'play') finish(true);
      else if (G.state === 'lose' && mode === 'play') { mode = 'dying'; setTimeout(() => finish(false), 700); }
    } else $('hint').hidden = true;
    renderCrowd(T); renderFoes(T); renderArrows(); renderObjs(dt, T);
    const tx = G.x * 0.55, tz = G.z;
    camX += (tx - camX) * Math.min(1, dt * 5); camZ += (tz - camZ) * Math.min(1, dt * 8);
    const far = mode === 'menu' ? 1 : 0;
    camera.position.set(camX + (far ? Math.sin(T * 0.25) * 1.5 : 0), 12.5 + far * 1.5, camZ + 12.5 + far * 2); camera.lookAt(camX * 0.7, 0, camZ - 12);
    sun.position.set(G.x + 8, 24, G.z + 8); sun.target.position.set(G.x, 0, G.z - 8);
    const showBubble = (mode === 'play' || mode === 'menu' || mode === 'dying') && G.count + G.heroes > 0 && $('scrLevels').hidden && $('scrCamp').hidden;
    const b = $('bubble');
    if (showBubble) { const p = toScreen(G.x, 2.4 + (G.heroes ? 2.6 : 0), G.z); b.hidden = !p.vis; b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; const label = fmt(G.count) + (G.heroes ? '<small>+' + G.heroes + ' Alp</small>' : ''); if (b.innerHTML !== label) b.innerHTML = label; } else b.hidden = true;
    $('progFill').style.width = (M.progress(G) * 100).toFixed(1) + '%';
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// Mağaza görselleri için sahne modu: ?kare=BÖLÜM&hiz=2 (araclar/magaza-gorselleri.js kullanır)
const Q = new URLSearchParams(location.search);
function autoSteer() {
  if (!G || mode !== 'play') return;
  const g = G.gates.find(g => !g.passed && G.z - g.z < 30 && G.z - g.z > -1);
  if (g) { G.tx = M.applyOp(G.count, g.L) >= M.applyOp(G.count, g.R) ? -3 : 3; return; }
  const o = G.objs.filter(o => o.alive && o.z < G.z && G.z - o.z < 30 && o.t !== 'barricade' && o.t !== 'block').sort((a, b) => b.z - a.z)[0];
  G.tx = o ? o.x : 0;
}
function boot() {
  if (Q.has('kare')) {
    S.sound = false; S.unlocked = NL; S.up = { start: 8, dmg: 8, rate: 8, zirh: 8 }; S.coins = 1840;
    S.stars = [3, 3, 3, 2, 3, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 1, 3, 3]; persist = () => {};
    const sc = +Q.get('hiz') || 1, ekran = Q.get('ekran');
    if (ekran) { previewLevel(+Q.get('kare') || 0); if (ekran === 'brief') openBrief(+Q.get('kare')); else { regionSel = +(Q.get('bolge') || 0); show(ekran); } }
    else {
      startGame(+Q.get('kare')); $('banner') && $('banner').remove(); hintT = 0;
      if (Q.has('ileri')) { const stopZ = G.L.endZ + (+Q.get('ileri')); let n = 0; while (G.z > stopZ && G.state === 'play' && n++ < 20000) { autoSteer(); M.step(G, 1 / 30); handleEvents(); } $('pops').innerHTML = ''; updateWeapon(); }
    }
    const step0 = M.step; M.step = (g, dt) => { autoSteer(); for (let k = 0; k < sc; k++) step0(g, dt); };
    requestAnimationFrame(t => { last = t; frame(t); });
    return;
  }
  previewLevel(nextLevel()); show('menu');
  requestAnimationFrame(t => { last = t; frame(t); });
}
// yazı tipi yüklenince başla (tuval etiketleri doğru yazı tipiyle çizilsin)
const ready = document.fonts && document.fonts.load ? Promise.race([Promise.all([document.fonts.load('800 64px "Baloo 2"'), document.fonts.load('600 16px "Baloo 2"')]), new Promise(r => setTimeout(r, 1500))]) : Promise.resolve();
ready.then(boot, boot);
})();
