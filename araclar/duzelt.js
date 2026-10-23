// Kalibrasyon sonrası güvenlik ağı: oyuncu botu bütün bölümleri sırayla oynar; bir bölümde
// LIMIT denemede takılırsa o bölümün CAL katsayısı %12 yumuşatılır ve tekrar dener. Sonuç mantik.js'e yazılır.
// Çalıştır: WRONG=0.3 JIT=2 DELAY=0.3 LIMIT=12 node araclar/duzelt.js
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, '../www/js/mantik.js'), M = require(P), { bot } = require('./bot.js');
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const LIMIT = +(process.env.LIMIT || 8);
let seedN = 1 + +(process.env.SEED || 0);
function play(i, up) {
  const G = M.newGame(i, up), o = { r: rng(seedN++ * 131), wrong: +(process.env.WRONG || 0.12), jit: +(process.env.JIT || 1.4), delay: +(process.env.DELAY || 0.2) };
  let n = 0; while ((G.state === 'play' || G.state === 'march') && n < 60 * 240) { bot(G, o); M.step(G, 1 / 30); n++; }
  return G;
}
const cal = M.CAL.slice(), up = { start: 0, dmg: 0, rate: 0, zirh: 0 }, done = [], changed = {};
let coins = 0, tries = 0;
for (let i = 0; i < M.NL;) {
  const G = play(i, up), win = G.state === 'win';
  coins += M.rewardOf(G, win, win && !done[i]); tries++;
  if (win) { done[i] = 1; tries = 0; i++; }
  else if (tries >= LIMIT) { cal[i] = +(cal[i] * 0.88).toFixed(3); M.LEVELS[i] = M.buildLevel(i, cal[i]); changed[i + 1] = cal[i]; tries = 0; }
  for (;;) { let bu = null, bc = 1e9; for (const u of M.UPG) { const l = up[u.k]; if (l >= M.upCap(M.seferOf(Math.min(i, M.NL - 1)))) continue; const c = M.upCost(u, l); if (c < bc) { bc = c; bu = u; } } if (!bu || coins < bc) break; coins -= bc; up[bu.k]++; }
}
let src = fs.readFileSync(P, 'utf8');
src = src.replace(/const CAL = \[[^\]]*\];/, 'const CAL = [' + cal.join(',') + '];');
fs.writeFileSync(P, src);
console.log('yumuşatılan bölümler:', JSON.stringify(changed));
