// Steam mağaza görselleri: kapsüller, kütüphane görselleri ve 1920×1080 ekran görüntüleri (TR ve EN).
// Önce: npx http-server . -p 8765 -c-1   Sonra: PW=... node araclar/steam/gorseller.js [kapsul|ekran]
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '../../store/steam'); fs.mkdirSync(OUT + '/ekran', { recursive: true });
const U = 'http://localhost:8765/www/index.html?';
const which = process.argv[2] || 'hepsi';
const SAH = 'kare=1060&ileri=330&temiz=1&hava=aksam';          // ana sahne: gün batımında dört şeritli dev ordu
const LOGO = `<div id="steamLogo" style="position:fixed;left:50%;top:var(--y);transform:translate(-50%,-50%) scale(var(--s));transform-origin:center;text-align:center;font-family:'Baloo 2',sans-serif;z-index:99">
  <div style="font-weight:800;font-size:22px;letter-spacing:.3em;color:#f0b232;text-shadow:0 2px 0 #12305a">☾ 1071 · 1453 ✸</div>
  <div style="margin:0;font-weight:800;font-size:96px;line-height:.95;color:#fff;text-shadow:0 4px 0 #1d3f6e,0 8px 0 #12305a,0 14px 24px rgba(0,0,0,.45)">MALAZGİRT</div>
  <div style="display:inline-block;margin-top:10px;background:linear-gradient(180deg,#2bb9be,#137479);border:4px solid #f0b232;border-radius:12px;padding:2px 28px 0;font-weight:800;font-size:40px;letter-spacing:.12em;color:#fff;box-shadow:0 5px 0 #9a5f0e">AKINCILARI</div></div>`;
const ASSETS = [  // ad, en, boy, logo ölçeği, logo dikey konumu (yoksa logo yok), sahne
  ['header_capsule', 920, 430, 1.1, '50%', SAH], ['small_capsule', 462, 174, 0.62, '50%', SAH], ['main_capsule', 1232, 706, 1.45, '42%', SAH],
  ['vertical_capsule', 748, 896, 1.25, '30%', SAH], ['library_capsule', 600, 900, 1.05, '26%', SAH], ['library_header', 920, 430, 1.1, '50%', SAH],
  ['library_hero', 3840, 1240, 0, null, 'kare=720&ileri=330&temiz=1&hava=aksam'], ['page_background', 1438, 810, 0, null, 'kare=1060&ileri=330&temiz=1&hava=gece']
];
const SHOTS = [
  ['01-yol', 'kare=7&ileri=130&hava=ogle'], ['02-dev', 'kare=19&ileri=40&yay=2'], ['03-uc-serit-yagmur', 'kare=420&ileri=230&hava=yagmur&yay=8'],
  ['04-gece', 'kare=720&ileri=330&hava=gece&yay=10'], ['05-fetih', 'kare=549&ileri=40&hava=sabah&yay=9'], ['06-kis', 'kare=880&ileri=220&hava=kis&yay=12'], ['07-1453', 'kare=1452&ileri=45&hava=sabah&yay=15']
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  if (which === 'hepsi' || which === 'kapsul') {
    const K = 'http://localhost:8765/araclar/steam/kapak.html?';
    const KAP = [['header_capsule', 920, 430, 'header'], ['small_capsule', 462, 174, 'small'], ['main_capsule', 1232, 706, 'main'], ['vertical_capsule', 748, 896, 'vertical'],
      ['library_capsule', 600, 900, 'library'], ['library_header', 920, 430, 'header'], ['library_hero', 3840, 1240, 'hero'], ['page_background', 1438, 810, 'bg']];
    for (const [ad, w, h, tur] of KAP) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto(K + `tur=${tur}&w=${w}&h=${h}`); await p.waitForFunction(() => document.title === 'hazir', null, { timeout: 60000 }); await p.waitForTimeout(400);
      await p.screenshot({ path: path.join(OUT, ad + '.png') }); await p.close(); console.log('✓', ad);
    }
    // kütüphane logosu: saydam zemin
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    await p.goto(U + 'kare=0&temiz=1'); await p.waitForTimeout(1500);
    await p.evaluate(html => { document.querySelectorAll('canvas,section,button,#hud,#weapon,#bubble').forEach(e => e.style.display = 'none'); document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; document.body.insertAdjacentHTML('beforeend', html); const L = document.getElementById('steamLogo'); L.style.setProperty('--s', 1.9); L.style.setProperty('--y', '50%'); }, LOGO);
    await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, 'library_logo.png'), omitBackground: true }); await p.close(); console.log('✓ library_logo');
  }
  if (which === 'hepsi' || which === 'ekran') {
    for (const dil of ['tr', 'en']) for (const [ad, q] of SHOTS) {
      const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
      await p.addInitScript(l => localStorage.setItem('malazgirt-akincilari-v1', JSON.stringify({ lang: l, sound: false })), dil);
      await p.goto(U + q + '&dil=' + dil); await p.waitForTimeout(3500);
      await p.screenshot({ path: path.join(OUT, 'ekran', dil + '-' + ad + '.png') }); await p.close(); console.log('✓', dil, ad);
    }
  }
  await b.close();
})();
