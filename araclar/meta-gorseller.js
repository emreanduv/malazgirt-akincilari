// Meta Horizon Store görselleri: kapaklar (yatay 2560×1440, kare 1440×1440, portre 1008×1440, hero 3000×900), simge 512 ve VR ekran görüntüleri (2560×1440).
// Önce: npx http-server . -p 8765 -c-1   Sonra: PW=... node araclar/meta-gorseller.js [kapak|ekran]
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '../store/meta'); fs.mkdirSync(OUT, { recursive: true });
const which = process.argv[2] || 'hepsi';
const K = 'http://localhost:8765/araclar/steam/kapak.html?';
const KAP = process.argv[3] === 'kare' ? [['kapak-kare', 1440, 1440, 'main']] : [['kapak-yatay', 2560, 1440, 'main'], ['kapak-kare', 1440, 1440, 'main'], ['kapak-portre', 1008, 1440, 'library'], ['kapak-hero', 3000, 900, 'main']];
// VR ekran görüntüleri: oturan oyuncunun gözünden harp masası ve at sırtı (?vrtest=1)
const U = 'http://localhost:8765/www/index.html?vrtest=1&';
const SHOTS = process.argv[3] === 'son' ? [['ekran-6-at-sirti', 'kare=300&ileri=140&yay=6&hava=sabah&atsirti=1'], ['ekran-7-dort-serit', 'kare=1060&ileri=330&hava=aksam&yay=14']] : [['ekran-1-harp-masasi', 'kare=300&ileri=150&hava=ogle&yay=6'], ['ekran-2-gun-batimi', 'kare=900&ileri=200&hava=aksam&yay=12'],
  ['ekran-3-gece-ordugah', 'kare=720&ileri=200&hava=gece&yay=10&bak=sol'], ['ekran-4-yagmur', 'kare=420&ileri=200&hava=yagmur&yay=8&bak=sag'], ['ekran-5-kis', 'kare=880&ileri=220&hava=kis&yay=12'],
  ['ekran-6-at-sirti', 'kare=300&ileri=140&yay=6&hava=sabah&atsirti=1'], ['ekran-7-dort-serit', 'kare=1060&ileri=330&hava=aksam&yay=14']];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  if (which === 'hepsi' || which === 'kapak') for (const [ad, w, h, tur] of KAP) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(K + `tur=${tur}&w=${w}&h=${h}`); await p.waitForFunction(() => document.title === 'hazir', null, { timeout: 90000 }); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, ad + '.png') }); await p.close(); console.log('✓', ad);
  }
  if (which === 'hepsi' || which === 'kapak') fs.copyFileSync(path.join(__dirname, '../store/play-icon-512.png'), path.join(OUT, 'simge-512.png'));
  if (which === 'hepsi' || which === 'ekran') for (const [ad, q] of SHOTS) {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
    await p.addInitScript(() => localStorage.setItem('malazgirt-akincilari-v1', JSON.stringify({ lang: 'tr', sound: false })));
    await p.goto(U + q); await p.waitForTimeout(5000);
    await p.evaluate(() => { document.querySelectorAll('#hud,#weapon,#bubble,#pops,#hint,#banner,#sndBtn,#setBtn,section').forEach(e => e.style.display = 'none'); });
    await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, ad + '.png') }); await p.close(); console.log('✓', ad);
  }
  await b.close();
})();
