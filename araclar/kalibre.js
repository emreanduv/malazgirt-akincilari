// Her bölümün zorluk katsayısını (CAL) ayarlar. Ölçüt: "acemi" oyuncuların (hata yapan, geç tepki veren
// botlar) ilk denemede kazanma oranı. Bölüm 1'de ~%95, bölüm 50'de ~%40: her bölüm bir tık daha zor.
// Acemi, Ordugâh'tan bir bölüm geriden gelir (kazandığı akçenin bir kısmını harcar).
// Çalıştır: node araclar/kalibre.js   (birkaç dakika sürer)
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, '../www/js/mantik.js');
const M = require(P);
const { bot } = require('./bot.js');

const target = i => 0.95 - 0.55 * Math.pow(i / 49, 0.85);   // acemi kazanma oranı
const SEEDS = 24;
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ACEMI = s => ({ r: rng(s), wrong: 0.4, jit: 2.2, delay: 0.35 });
function game(i, f, up, o) {
  M.LEVELS[i] = M.buildLevel(i, f);
  const G = M.newGame(i, up); let n = 0;
  while (G.state === 'play' && n < 30 * 240) { bot(G, o); M.step(G, 1 / 30); n++; }
  return G;
}
function winRate(i, f, up) {
  let w = 0;
  for (let s = 1; s <= SEEDS; s++) { const G = game(i, f, up, ACEMI(s * 977 + i * 13)); if (G.state !== 'lose' && G.state !== 'play') w++; }
  return w / SEEDS;
}
// Akçe: acemi her bölümü bir kez kazanır; kazandığının %70'ini en ucuz geliştirmeye harcar.
const up = { start: 0, dmg: 0, rate: 0, zirh: 0 }; let coins = 0, saved = 0;
function shop() {
  for (;;) { let bu = null, bc = 1e9;
    for (const u of M.UPG) { const l = up[u.k]; if (l >= M.UPMAX) continue; const c = M.upCost(u, l); if (c < bc) { bc = c; bu = u; } }
    if (!bu || coins < bc) break; coins -= bc; up[bu.k]++; }
}
const out = [];
for (let i = 0; i < 50; i++) {
  const tg = target(i);
  // kazanma oranı f arttıkça düşer: log uzayında ikiye bölme
  let lo = Math.log(0.25), hi = Math.log(3);
  for (let k = 0; k < 11; k++) { const mid = (lo + hi) / 2; if (winRate(i, Math.exp(mid), up) >= tg) lo = mid; else hi = mid; }
  let f = Math.exp(lo);
  // önceki bölümden belirgin kolay olmasın (zorluk eğrisi düzgün yükselsin)
  out.push(+f.toFixed(3));
  const G = game(i, f, up, ACEMI(4242 + i));
  const r = M.rewardOf(G, true, true);
  coins += Math.round(r * 0.7); saved += r - Math.round(r * 0.7); shop();
  process.stdout.write(`B${i + 1}:${f.toFixed(2)}(%${Math.round(100 * winRate(i, f, up))}) `);
}
console.log();
let src = fs.readFileSync(P, 'utf8');
src = src.replace(/const CAL = \[[^\]]*\];/, 'const CAL = [' + out.join(',') + '];');
fs.writeFileSync(P, src);
console.log('CAL yazıldı');
