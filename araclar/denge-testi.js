// Denge testi: basit bir "oyuncu" 50 bölümü sırayla oynar, kazandığı akçeyle geliştirme alır.
// Çalıştır: node araclar/denge-testi.js
const M = require('../www/js/mantik.js');

const { bot } = require('./bot.js');

function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let seedN = 1;
function play(i, up) {
  const G = M.newGame(i, up);
  const o = { r: rng(seedN++ * 131), wrong: +(process.env.WRONG || 0.12), jit: +(process.env.JIT || 1.4), delay: +(process.env.DELAY || 0.2) };   // hata yapan "insan" oyuncu
  let n = 0;
  while ((G.state === 'play' || G.state === 'march') && n < 60 * 240) { bot(G, o); M.step(G, 1 / 30); n++; }
  return G;
}

if (!process.argv[2]) {
const up = { start: 0, dmg: 0, rate: 0, zirh: 0 };
let coins = 0, tries = 0, totalTries = 0;
const best = [];
const rows = [];
for (let i = 0; i < M.NL;) {
  const G = play(i, up);
  const win = G.state === 'win';
  coins += M.rewardOf(G, win, win && !best[i]);
  tries++; totalTries++;
  if (win) {
    best[i] = 1;
    rows.push(`B${String(i + 1).padStart(2)} ${M.LEVELS[i].ad.padEnd(22)} deneme:${tries} kalan:${String(G.count).padStart(4)} zirve:${String(G.peak).padStart(4)} yıldız:${M.starsOf(G)} süre:${G.t.toFixed(0)}s gel:${JSON.stringify(up)}`);
    tries = 0; i++;
  } else if (tries > 40) { rows.push(`B${i + 1} TAKILDI ${JSON.stringify(up)} ${coins}`); break; }
  // geliştirme al (en ucuzu)
  for (;;) {
    let bestU = null, bc = 1e9;
    for (const u of M.UPG) { const l = up[u.k]; if (l >= M.upCap(M.seferOf(i < M.NL ? i : M.NL - 1))) continue; const c = M.upCost(u, l); if (c < bc) { bc = c; bestU = u; } }
    if (!bestU || coins < bc) break; coins -= bc; up[bestU.k]++;
  }
}
console.log(rows.join('\n'));
console.log('toplam deneme', totalTries, 'akçe', coins);
}
if (process.argv[2]) {
  const i = +process.argv[2] - 1; const u = JSON.parse(process.argv[3] || '{}');
  const G = M.newGame(i, u); let n = 0, lastLog = 0;
  while ((G.state === 'play') && n < 60 * 240) { bot(G); M.step(G, 1 / 30); n++;
    for (const e of G.events) if (['gate','weapon','hero','troops','crash','win','lose'].includes(e.type)) console.log(G.t.toFixed(1), e.type, e.d ?? e.v ?? e.w ?? '', 'count', G.count, 'tier', G.wTier);
    if (G.t - lastLog > 3) { lastLog = G.t; const b = G.objs.find(o => o.t === 'boss' || o.final); console.log(G.t.toFixed(1), 'z', G.z.toFixed(0), 'count', G.count, 'boss', b.hp ?? b.n); } }
  console.log(G.state);
}
