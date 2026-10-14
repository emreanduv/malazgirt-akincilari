// Her bölümün zorluk katsayısını, "ortalama" bir oyuncu (bot + o bölüme kadar beklenen geliştirmeler)
// sona hedeflenen oranda akıncıyla varacak şekilde ayarlar. Çıktıyı mantik.js içindeki CAL dizisine yazar.
// Çalıştır: node araclar/kalibre.js
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, '../www/js/mantik.js');
const M = require(P);
const { bot } = require('./bot.js');

const target = i => 0.62 - 0.47 * (i / 49);          // sona kalan / zirve oranı: 0.62 → 0.15
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function game(i, f, up, seed) {
  M.LEVELS[i] = M.buildLevel(i, f);
  const G = M.newGame(i, up); let n = 0;
  const o = seed ? { r: rng(seed * 977 + i), wrong: 0.12, jit: 1.4, delay: 0.2 } : {};
  while (G.state === 'play' && n < 30 * 240) { bot(G, o); M.step(G, 1 / 30); n++; }
  return G;
}
// 7 farklı "oyuncu" (hata yapan botlar) oynar; sonuç = medyan kalan oranı (kayıp = 0)
function run(i, f, up) {
  const rs = [];
  for (let s = 1; s <= 7; s++) { const G = game(i, f, up, s); rs.push(G.state === 'lose' || G.state === 'play' ? 0 : G.count / Math.max(1, G.peak)); }
  rs.sort((a, b) => a - b); return rs[3];
}
// İlerleme: bot her bölümü ilk denemede geçer, kazandığı akçeyle en ucuz geliştirmeyi alır (gerçek oyuncu biraz geride kalabilir; o zaman eski bölümleri tekrar oynar).
const up = { start: 0, dmg: 0, rate: 0, zirh: 0 }; let coins = 0;
function shop() {
  for (;;) { let bu = null, bc = 1e9;
    for (const u of M.UPG) { const l = up[u.k]; if (l >= M.UPMAX) continue; const c = M.upCost(u, l); if (c < bc) { bc = c; bu = u; } }
    if (!bu || coins < bc) break; coins -= bc; up[bu.k]++; }
}
// Her bölüm için: tipik oyuncuların (7 botun) çoğunun kaybettiği zorluk eşiğini bul,
// sonra bölümü bu eşiğin bir oranına koy. Oran 0.50'den (kolay) 0.88'e (çok zor) çıkar: her bölüm bir tık daha zor.
const margin = i => 0.50 + 0.38 * Math.pow(i / 49, 0.9);
const out = [];
for (let i = 0; i < 50; i++) {
  let fail = 8;
  for (let f = 0.1; f <= 8; f *= 1.06) { if (run(i, f, up) <= 0) { fail = f; break; } }
  const best = Math.max(0.08, fail * margin(i));
  out.push(+best.toFixed(3));
  const G = game(i, best, up);
  coins += M.rewardOf(G, G.state === 'win' || G.state === 'march', true); shop();
  process.stdout.write(`B${i + 1}:${best.toFixed(2)}(eşik ${fail.toFixed(2)}, r=${run(i, best, up).toFixed(2)}) `);
}
console.log();
let src = fs.readFileSync(P, 'utf8');
src = src.replace(/const CAL = \[[^\]]*\];/, 'const CAL = [' + out.join(',') + '];');
fs.writeFileSync(P, src);
console.log('CAL yazıldı');
