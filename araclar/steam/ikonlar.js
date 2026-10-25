// Steam başarım ikonlarını üretir (256 ve 64 piksel; açık ve kilitli). Yerel sunucu: npx http-server . -p 8765
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'), path = require('path');
const list = require('./basarimlar.js');
const OUT = path.join(__dirname, '../../store/steam/basarim-ikon');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://localhost:8765/araclar/ikon.html?tur=ikon'); await p.waitForTimeout(300);
  await p.addStyleTag({ content: '@font-face{font-family:"B2";font-weight:800;src:url(/www/fonts/baloo-2-latin-800-normal.woff2) format("woff2")}' });
  await p.evaluate(() => document.fonts.load('800 40px "B2"'));
  for (const a of list) for (const kilit of [false, true]) {
    const data = await p.evaluate(({ yil, kilit }) => {
      const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
      const g = x.createRadialGradient(S / 2, S * .42, 8, S / 2, S / 2, S * .75); g.addColorStop(0, '#2c5c9a'); g.addColorStop(.6, '#1d3f6e'); g.addColorStop(1, '#0c1c34');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      const star = (r, fill, stroke, lw) => { x.save(); x.translate(S / 2, S / 2); for (let k = 0; k < 2; k++) { x.save(); x.rotate(k * Math.PI / 4); x.beginPath(); x.rect(-r * .707, -r * .707, r * 1.414, r * 1.414); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.lineWidth = lw; x.strokeStyle = stroke; x.stroke(); } x.restore(); } x.restore(); };
      star(S * .46, '#f0b232', '#9a5f0e', 6); star(S * .39, '#1fa3a8'); star(S * .36, null, 'rgba(255,248,234,.6)', 3);
      let fs = 92; x.font = `800 ${fs}px "B2"`; while (x.measureText(yil).width > S * .62 && fs > 30) { fs -= 4; x.font = `800 ${fs}px "B2"`; }
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = '#0c1c34'; x.strokeText(yil, S / 2, S / 2 + 8); x.fillStyle = '#fff8ea'; x.fillText(yil, S / 2, S / 2 + 8);
      if (kilit) { const d = x.getImageData(0, 0, S, S); for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] * .3 + d.data[i + 1] * .59 + d.data[i + 2] * .11) * .55; d.data[i] = d.data[i + 1] = d.data[i + 2] = l; } x.putImageData(d, 0, 0); }
      const s64 = document.createElement('canvas'); s64.width = s64.height = 64; s64.getContext('2d').drawImage(c, 0, 0, 64, 64);
      return [c.toDataURL('image/png'), s64.toDataURL('image/png')];
    }, { yil: a.yil, kilit });
    const n = a.id + (kilit ? '_kilitli' : '');
    fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(data[0].split(',')[1], 'base64'));
    fs.mkdirSync(path.join(OUT, '64'), { recursive: true });
    fs.writeFileSync(path.join(OUT, '64', n + '.png'), Buffer.from(data[1].split(',')[1], 'base64'));
  }
  await b.close(); console.log('ikonlar:', list.length * 2);
})();
