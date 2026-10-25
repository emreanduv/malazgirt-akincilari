// İngilizce içeriği tek dosyada toplar ve mantik.js ile karşılaştırır: node araclar/en/derle.js
const fs = require('fs'), path = require('path');
const M = require('../../www/js/mantik.js');
const r0 = require('./r0.js');
const regions = [].concat(...[1, 2, 3, 4, 5].map(k => require('./r' + k + '.js')));
const err = [];
if (regions.length !== M.REGIONS.length) err.push('bölge sayısı ' + regions.length + ' / ' + M.REGIONS.length);
M.REGIONS.forEach((R, r) => { const E = regions[r]; if (!E) return;
  if (E[2].length !== R.names.length) err.push('bölge ' + r + ' (' + R.ad + ') ad sayısı ' + E[2].length + '/' + R.names.length);
  if (E[3].length !== R.lines.length) err.push('bölge ' + r + ' (' + R.ad + ') satır sayısı ' + E[3].length + '/' + R.lines.length); });
if (r0.seferler.length !== M.SEFERLER.length) err.push('sefer sayısı ' + r0.seferler.length + '/' + M.SEFERLER.length);
for (const k in M.BOSSES) { if (!r0.bosses[k]) err.push('dev adı yok: ' + k); if (!r0.bossTxt[k]) err.push('dev metni yok: ' + k); }
for (const k in M.FOES) if (!r0.foes[k]) err.push('birlik yok: ' + k);
if (r0.weapons.length !== M.WEAPONS.length) err.push('yay sayısı');
const src = fs.readFileSync(path.join(__dirname, '../../www/js/mantik.js'), 'utf8');
const unl = [...src.match(/const UNLOCK_TXT = \{([\s\S]*?)\n\};/)[1].matchAll(/^\s+(\d+):/gm)].map(m => m[1]);
unl.forEach(k => { if (!r0.unlock[k]) err.push('açılış metni yok: ' + k); });
if (err.length) { console.log('HATA\n' + err.join('\n')); process.exit(1); }
const out = Object.assign({}, r0, { regions });
fs.writeFileSync(path.join(__dirname, '../../www/js/icerik-en.js'), '/* Malazgirt Akıncıları: English content (araclar/en/derle.js üretir) */\nwindow.ICERIK_EN = ' + JSON.stringify(out) + ';\n');
console.log('yazıldı: www/js/icerik-en.js', (JSON.stringify(out).length / 1024).toFixed(0) + ' KB');
