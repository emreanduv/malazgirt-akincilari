// Her bölümün zorluk katsayısını (CAL) ayarlar. Ölçüt: "ortalama" oyuncuların (ara sıra hata yapan botlar)
// ilk denemede kazanma oranı. Eğri testere dişi: her bölge içinde zorlaşır, yeni sefer biraz nefes aldırır,
// genel çizgi 1. bölümde ~%95'ten 200. bölümde ~%25'e iner.
// Oyuncu kazandığı akçenin %85'ini Ordugâh'a harcar, sefer tavanını aşamaz.
// Çalıştır: node araclar/kalibre.js [başlangıç bölümü, 1'den]   (≈10 dakika)
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, '../www/js/mantik.js');
const M = require(P);
const { bot } = require('./bot.js');

const NL = M.NL;
function target(i) {
  const k = i % 10, li = i % 50;
  let t = 0.95 - 0.62 * Math.pow(i / 199, 0.65) - 0.08 * (k / 9);
  if (li < 3) t += 0.06;                       // yeni sefer: ilk bölümler nefes aldırır
  return Math.min(0.97, Math.max(0.15, t));
}
const SEEDS = 24;
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ACEMI = s => ({ r: rng(s), wrong: 0.3, jit: 2.0, delay: 0.3 });   // ortalama oyuncu
function game(i, f, up, o) {
  M.LEVELS[i] = M.buildLevel(i, f);
  const G = M.newGame(i, up); let n = 0;
  while (G.state === 'play' && n < 30 * 300) { bot(G, o); M.step(G, 1 / 30); n++; }
  return G;
}
function winRate(i, f, up) {
  let w = 0;
  for (let s = 1; s <= SEEDS; s++) { const G = game(i, f, up, ACEMI(s * 977 + i * 13)); if (G.state !== 'lose' && G.state !== 'play') w++; }
  return w / SEEDS;
}
const up = { start: 0, dmg: 0, rate: 0, zirh: 0 }; let coins = 0;
function shop(cap) {
  for (;;) { let bu = null, bc = 1e9;
    for (const u of M.UPG) { const l = up[u.k]; if (l >= cap) continue; const c = M.upCost(u, l); if (c < bc) { bc = c; bu = u; } }
    if (!bu || coins < bc) break; coins -= bc; up[bu.k]++; }
}
const out = M.CAL.slice(0, NL);
const from = Math.max(0, (+process.argv[2] || 1) - 1);
for (let i = 0; i < NL; i++) {
  if (i >= from) {
    const tg = target(i);
    let lo = Math.log(0.2), hi = Math.log(6);
    for (let k = 0; k < 12; k++) { const mid = (lo + hi) / 2; if (winRate(i, Math.exp(mid), up) >= tg) lo = mid; else hi = mid; }
    out[i] = +Math.exp(lo).toFixed(3);
    process.stdout.write(`B${i + 1}:${out[i]}(%${Math.round(100 * winRate(i, out[i], up))}/%${Math.round(100 * tg)}) `);
    if ((i + 1) % 10 === 0) {
      console.log(' up=' + JSON.stringify(up));
      let src = fs.readFileSync(P, 'utf8');   // ara kayıt
      src = src.replace(/const CAL = \[[^\]]*\];/, 'const CAL = [' + out.map(x => x || 1).join(',') + '];');
      fs.writeFileSync(P, src);
    }
  }
  const G = game(i, out[i] || 1, up, ACEMI(4242 + i));
  const r = M.rewardOf(G, true, true);
  coins += Math.round(r * 0.85); shop(M.upCap(M.seferOf(i)));
}
console.log();
let src = fs.readFileSync(P, 'utf8');
src = src.replace(/const CAL = \[[^\]]*\];/, 'const CAL = [' + out.join(',') + '];');
fs.writeFileSync(P, src);
console.log('CAL yazıldı', JSON.stringify(up));
