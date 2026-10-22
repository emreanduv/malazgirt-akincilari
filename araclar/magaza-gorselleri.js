// Mağaza görsellerini üretir: ikon, açılış ekranı, Google Play öne çıkan görsel ve ekran görüntüleri.
// Gerekenler: npm i -D playwright && npx playwright install chromium
// Önce proje kökünde yerel sunucu aç:  npx http-server . -p 8765 -c-1
// Sonra:  node araclar/magaza-gorselleri.js [ikon|ekran]
const { chromium } = require(process.env.PW || 'playwright');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const URL = 'http://localhost:8765';
const which = process.argv[2] || 'hepsi';

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  if (which === 'hepsi' || which === 'ikon') {
    const out = { ikon: 'assets/icon-only.png', 'ikon-on': 'assets/icon-foreground.png', splash: 'assets/splash.png', feature: 'assets/feature-graphic.png' };
    for (const [tur, w, h] of [['ikon', 1024, 1024], ['ikon-on', 1024, 1024], ['splash', 2732, 2732], ['feature', 1024, 500]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto(`${URL}/araclar/ikon.html?tur=${tur}`); await p.waitForFunction(() => document.title === 'hazir'); await p.waitForTimeout(400);
      await p.locator('#w').screenshot({ path: path.join(ROOT, out[tur]), omitBackground: tur === 'ikon-on' });
      await p.close(); console.log('✓', out[tur]);
    }
  }
  if (which === 'hepsi' || which === 'ekran') {
    // [ad, adres, bekleme(ms)]
    const scenes = [
      ['01-sefer', '/www/index.html?kare=7&ileri=34', 3500],
      ['02-dev', '/www/index.html?kare=19&ileri=40', 4000],
      ['03-hacli-krali', '/www/index.html?kare=449&ileri=40', 4000],
      ['04-harita', '/www/index.html?kare=480&ekran=levels&bolge=44', 2500],
      ['05-menu', '/www/index.html?kare=0&ekran=menu', 3000]
    ];
    const devices = [
      ['store/screenshots-ios/iphone', 430, 932, 3],   // 1290 × 2796 (6.7"/6.9")
      ['store/screenshots-ios/ipad', 1024, 1366, 2],   // 2048 × 2732 (12.9"/13")
      ['store/screenshots/android', 360, 640, 3]       // 1080 × 1920
    ];
    for (const [pre, w, h, dpr] of devices) {
      for (const [ad, u, wait] of scenes) {
        const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
        await p.goto(URL + u); await p.waitForTimeout(wait);
        await p.screenshot({ path: path.join(ROOT, `${pre}-${ad}.png`) });
        await p.close(); console.log('✓', `${pre}-${ad}.png`);
      }
    }
  }
  await b.close();
})();
