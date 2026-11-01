/* Malazgirt Akıncıları — VR "Harp Masası" (WebXR, Meta Quest)
   Bütün savaş alanı oyuncunun önündeki bir harp masasının üstünde minyatür olarak oynanır.
   oyun.js'ten sonra yüklenir; oyun.js'in sahnesini, oyun durumunu (G, mode) ve işlevlerini kullanır.
   Denetim: kumanda çubuğu sağa-sola, ya da tetik/çimdik basılıyken eli sağa-sola çekmek.
   Tetik / çimdik: başla · devam · yeniden dene. Masanın yüksekliği: B / Y düğmesi ya da sol çubuk yukarı-aşağı. */
window.VR_KUR = function (O) {
  'use strict';
  const xr = navigator.xr;
  const { scene, renderer, camera, $, t, fmt, D, SFX, NL, canPlay, startGame, previewLevel, show, unlockAudio, nextLevel, resize, frame } = O;
  const TABLE = { s: 0.024, y: 0.78, z: -0.62, w: 0.62, d: 1.25 };   // ölçek (1 m = 3,2 cm), masa yüksekliği, uzaklığı, genişliği, derinliği
  const VR = window.VR = { on: false, test: new URLSearchParams(location.search).has('vrtest'), update, TABLE };

  /* ---------- masa, çerçeve ve havada duran tabela (sahne ölçeğinden bağımsız) ---------- */
  const fixed = new THREE.Group();                 // dünya ölçeğinde nesneler: her karede sahnenin ölçeği geri alınır
  const wood = new THREE.MeshLambertMaterial({ color: 0x5a3a22 }), brass = new THREE.MeshPhongMaterial({ color: 0xc89b3c, shininess: 60, specular: 0x6a5020 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(TABLE.w + 0.12, 0.05, TABLE.d + 0.12), wood); top.position.y = -0.03; fixed.add(top);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, TABLE.y, 0.06), wood); l.position.set(x * (TABLE.w / 2), -TABLE.y / 2 - 0.03, (z * TABLE.d) / 2 - 0.1 * z); fixed.add(l); }
  for (const [w, d, x, z] of [[TABLE.w + 0.14, 0.03, 0, -TABLE.d / 2 - 0.06], [TABLE.w + 0.14, 0.03, 0, TABLE.d / 2 + 0.06], [0.03, TABLE.d + 0.14, -TABLE.w / 2 - 0.06, 0], [0.03, TABLE.d + 0.14, TABLE.w / 2 + 0.06, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.035, d), brass); b.position.set(x, 0.0, z); fixed.add(b);
  }
  // çadır içi: zemin halısı ve uzak duvar (gökyüzü rengi minyatürde düz bir renge dönüşmesin)
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.4, 40), new THREE.MeshLambertMaterial({ color: 0x7a2630 })); rug.rotation.x = -Math.PI / 2; rug.position.y = -TABLE.y; fixed.add(rug);
  const tent = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 4, 24, 1, true), new THREE.MeshLambertMaterial({ color: 0xe9dcc0, side: THREE.BackSide }));
  tent.position.y = -TABLE.y + 2; fixed.add(tent);
  // tabela: bölüm, ordu sayısı, iletiler
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.16), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  board.position.set(0, 0.42, -TABLE.d / 2 - 0.05); board.rotation.x = -0.12; fixed.add(board);
  let lastTxt = '';
  function drawBoard(l1, l2) {
    const k = l1 + '|' + l2; if (k === lastTxt) return; lastTxt = k;
    cx.clearRect(0, 0, 1024, 256);
    cx.fillStyle = 'rgba(12,28,52,.86)'; roundRect(8, 8, 1008, 240, 36); cx.fill();
    cx.strokeStyle = '#f0b232'; cx.lineWidth = 8; roundRect(8, 8, 1008, 240, 36); cx.stroke();
    cx.textAlign = 'center'; cx.fillStyle = '#fff'; cx.font = '800 76px "Baloo 2", sans-serif'; cx.fillText(l1, 512, 112);
    cx.fillStyle = '#ffe9a8'; cx.font = '700 46px "Baloo 2", sans-serif'; cx.fillText(l2, 512, 196);
    tex.needsUpdate = true;
  }
  function roundRect(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

  // minyatürü masanın sınırlarında kes (dünya koordinatlarında kırpma düzlemleri)
  const clip = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
  function setClip(tableY) {
    const x0 = TABLE.w / 2, z0 = TABLE.z - TABLE.d / 2, z1 = TABLE.z + TABLE.d / 2;
    clip[0].constant = x0; clip[1].constant = x0; clip[2].constant = -z0; clip[3].constant = z1;
  }
  // kırpma yalnızca savaş alanına: masa, çadır ve kumandalar kırpılmaz
  const clipped = new Set(); let clipT = 0;
  function clipAll() {
    scene.traverse(o => {
      if (o === fixed || o === VR.ctrl0 || o === VR.ctrl1) return;
      let p = o.parent; while (p) { if (p === fixed || p === VR.ctrl0 || p === VR.ctrl1) return; p = p.parent; }
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) if (!clipped.has(m)) { m.clippingPlanes = clip; m.needsUpdate = true; clipped.add(m); }
    });
  }
  function unclipAll() { for (const m of clipped) { m.clippingPlanes = null; m.needsUpdate = true; } clipped.clear(); }

  /* ---------- her kare: sahneyi masanın üstüne yerleştir, girdileri oku ---------- */
  let tableY = TABLE.y, camXv = 0, camZv = 0, grab = null, btnPrev = {}, msgT = 0, msg = '';
  function update(dt) {
    const s = TABLE.s;
    camXv += (O.G().x * 0.6 - camXv) * Math.min(1, dt * 4); camZv += (O.G().z - camZv) * Math.min(1, dt * 6);
    // ordu masanın ön tarafında (oyuncuya yakın), yol ileriye doğru uzanır
    scene.scale.setScalar(s);
    scene.position.set(-camXv * s, tableY + 0.012, TABLE.z + TABLE.d / 2 - 0.16 - camZv * s);
    scene.updateMatrix();
    // sabit nesneler: sahne ölçeğini geri al
    fixed.scale.setScalar(1 / s);
    fixed.position.set(camXv, (tableY - scene.position.y) / s, (TABLE.z - scene.position.z) / s);
    setClip(tableY);
    scene.fog.near = 1e5; scene.fog.far = 2e5;   // minyatürde sis yok
    if ((clipT -= dt) <= 0) { clipT = 0.5; clipAll(); }
    if (!VR.test) readInput(dt);
    // tabela
    const lv = t('Bölüm {n}', { n: O.G().i + 1 });
    if (msgT > 0) { msgT -= dt; drawBoard(lv, msg); }
    else if (O.mode() === 'play') drawBoard(lv + ' · ' + fmt(O.G().count) + (O.G().heroes ? ' +' + O.G().heroes : ''), O.G().L.ad);
    else if (O.mode() === 'over') drawBoard(O.lastRes() && O.lastRes().win ? t('ZAFER!') + ' ' + '★'.repeat(O.lastRes().stars) : t('GERİ ÇEKİL!'), O.lastRes() && O.lastRes().win ? t('Tetiğe bas: devam') : t('Tetiğe bas: yeniden dene'));
    else drawBoard(lv, t('Tetiğe bas: sefere çık'));
  }
  function say(m, sec) { msg = m; msgT = sec || 2.5; }

  // VR'da öğrenirken daha kolay: her bölüm başında ordu biraz daha büyük başlar
  let boosted = null;
  function easyStart() {
    const g = O.G(); if (!g || O.mode() !== 'play' || boosted === g) return;
    boosted = g; const k = g.i < 20 ? 2 : 1.4; g.count = Math.round(g.count * k) + (g.i < 20 ? 6 : 3);
  }
  function readInput(dt) {
    easyStart();
    const session = renderer.xr.getSession(); if (!session) return;
    for (const src of session.inputSources) {
      const gp = src.gamepad; if (!gp) continue;
      const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0] || 0, ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1] || 0;
      if (O.mode() === 'play' && Math.abs(ax) > 0.15) O.G().tx += ax * 14 * dt;
      // sol çubuk yukarı-aşağı: masa yüksekliği
      if (src.handedness === 'left' && Math.abs(ay) > 0.5) tableY = Math.max(0.45, Math.min(1.25, tableY - ay * 0.4 * dt));
      // B / Y: masayı varsayılan yüksekliğe al
      const by = gp.buttons[5] && gp.buttons[5].pressed, key = src.handedness + '5';
      if (by && !btnPrev[key]) { tableY = TABLE.y; say(t('Masa yüksekliği sıfırlandı'), 1.5); }
      btnPrev[key] = by;
    }
    // tetik/çimdik basılıyken elle sürükle
    if (grab && O.mode() === 'play') {
      const p = grab.ctrl.position.x;
      O.G().tx += (p - grab.x) / TABLE.s * 0.9; grab.x = p;
    }
  }

  function labelPlane(lines) {
    const c2 = document.createElement('canvas'); c2.width = 512; c2.height = 64 + 56 * lines.length; const g = c2.getContext('2d');
    g.fillStyle = 'rgba(12,28,52,.85)'; g.fillRect(0, 0, c2.width, c2.height); g.strokeStyle = '#f0b232'; g.lineWidth = 6; g.strokeRect(3, 3, c2.width - 6, c2.height - 6);
    g.fillStyle = '#fff'; g.font = '700 40px "Baloo 2", sans-serif'; g.textAlign = 'center';
    lines.forEach((l, i) => g.fillText(l, 256, 70 + i * 56));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12 * c2.height / 512), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2), transparent: true, depthTest: false }));
    m.renderOrder = 10; return m;
  }

  /* ---------- kumandalar ve eller ---------- */
  for (let k = 0; k < 2; k++) {
    const c = renderer.xr.getController(k);
    c.addEventListener('selectstart', () => {
      unlockAudio();
      if (O.mode() === 'play') { grab = { ctrl: c, x: c.position.x }; return; }
      act();
    });
    c.addEventListener('selectend', () => { if (grab && grab.ctrl === c) grab = null; });
    // kumanda ucunda küçük altın ok
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.05, 8), brass); tip.rotation.x = -Math.PI / 2; tip.position.z = -0.03; c.add(tip);
    // kumandanın üstünde ne işe yaradığını yazan küçük etiket
    const lab = labelPlane(k === 0 ? [t('Tetik: başla / sürükle'), t('Çubuk: yönlendir')] : [t('Tetik: başla / sürükle'), t('Çubuk ↕: masa yüksekliği')]);
    lab.position.set(0, 0.06, -0.02); lab.rotation.x = -0.7; c.add(lab);
    VR['ctrl' + k] = c;
  }
  function act() {
    if (O.mode() === 'over' && O.lastRes()) {
      const i = O.lastRes().win ? Math.min(NL - 1, O.lastRes().i + 1) : O.lastRes().i;
      if (!canPlay(i)) { say(t('Tam Sürüm gerekli: ana menüden alabilirsin'), 4); return; }
      startGame(i); return;
    }
    if (O.mode() === 'menu' || O.mode() === 'over') { const i = nextLevel(); if (!canPlay(i)) { say(t('Tam Sürüm gerekli: ana menüden alabilirsin'), 4); return; } startGame(i); }
  }

  /* ---------- oturum ---------- */
  function enter(session) {
    VR.on = true; document.body.classList.add('vr-on'); const gt = document.getElementById('vrGate'); if (gt) gt.hidden = true;
    renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor');
    renderer.localClippingEnabled = true;
    scene.add(fixed); scene.add(VR.ctrl0); scene.add(VR.ctrl1);
    fogNear = scene.fog.near; fogFar = scene.fog.far;
    renderer.xr.setSession(session);
    renderer.setAnimationLoop(frame);
    session.addEventListener('end', leave);
    tableY = TABLE.y; camXv = O.G() ? O.G().x * 0.6 : 0; camZv = O.G() ? O.G().z : 0;
    say(t('Tetiğe bas: sefere çık · Çubukla yönlendir'), 6);
  }
  let fogNear = 70, fogFar = 200;
  function leave() {
    VR.on = false; document.body.classList.remove('vr-on'); grab = null; const gt = document.getElementById('vrGate'); if (gt) gt.hidden = false;
    renderer.setAnimationLoop(null); renderer.xr.enabled = false;
    unclipAll(); scene.remove(fixed); scene.remove(VR.ctrl0); scene.remove(VR.ctrl1);
    scene.scale.setScalar(1); scene.position.set(0, 0, 0); scene.updateMatrix();
    scene.fog.near = fogNear; scene.fog.far = fogFar;
    resize();
    if (O.mode() === 'play') { O.setPaused(true); show('pause'); } else { previewLevel(nextLevel()); show('menu'); }
    requestAnimationFrame(ts => { O.setLast(ts); frame(ts); });
  }
  VR.state = () => ({ mode: O.mode(), lvl: O.G() && O.G().i, count: O.G() && O.G().count, x: O.G() && O.G().x });
  VR.start = async function () {
    try {
      const session = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
      if (!O.G()) previewLevel(nextLevel());
      if (O.mode() !== 'play') O.setMode('menu');
      show(null); $('hud').hidden = true; $('weapon').hidden = true;
      enter(session);
    } catch (e) { console.log('VR açılamadı', e); }
  };

  /* ---------- ana menüde "VR" düğmesi (yalnızca gözlük destekliyorsa) ---------- */
  function addButton() {
    const b = document.createElement('button'); b.id = 'bVR'; b.className = 'fullchip'; b.innerHTML = '🥽 <span data-t>Harp Masası (VR)</span>';
    b.addEventListener('click', () => { SFX.click(); VR.start(); });
    const row = $('bLevels').parentElement; row.parentElement.insertBefore(b, row.nextSibling);
    D.applyStatic();
  }
  // Quest'te (gözlük tarayıcısı ya da mağaza uygulaması) oyun doğrudan harp masasına açılsın: tek dokunuşluk büyük giriş ekranı
  function addGate() {
    const d = document.createElement('div'); d.id = 'vrGate';
    d.innerHTML = '<div class="vg"><div class="vgT">MALAZGİRT</div><div class="vgR">AKINCILARI</div><button id="vgGo">🥽 <span>' + t('Harp Masasına Gir') + '</span></button><p>' + t('Tetiğe bas · Oturarak oyna') + '</p><p class="vgC">Bir Mr. Anduv! yapımıdır.</p></div>';
    document.body.appendChild(d);
    d.querySelector('#vgGo').addEventListener('click', () => { SFX.click(); VR.start(); });
  }
  const quest = /OculusBrowser|Quest|Meta Quest/i.test(navigator.userAgent);
  if (xr && xr.isSessionSupported) xr.isSessionSupported('immersive-vr').then(ok => { if (ok) { addButton(); if (quest || new URLSearchParams(location.search).has('vr')) addGate(); } }).catch(() => {});

  /* ---------- gözlüksüz deneme: ?vrtest=1 (masayı oturan bir oyuncunun gözünden gösterir) ---------- */
  if (VR.test) {
    VR.on = true; scene.add(fixed); renderer.localClippingEnabled = true;
    VR.testCam = () => { camera.position.set(0, 1.25, 0.3); camera.lookAt(0, TABLE.y, TABLE.z - 0.1); camera.fov = 75; camera.updateProjectionMatrix(); };
  }
};
