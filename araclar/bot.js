// Denge testleri için basit oyuncu: kapıda iyi tarafı seçer, eritebildiği kaideye hizalanır, eritemediğinden kaçar.
const M = require('../www/js/mantik.js');
function bot(G, o) {
  o = o || {};
  if (o.r) {   // insan benzeri hata: geç tepki ve titrek nişan
    if (G._next && G.t < G._next) return;
    G._next = G.t + (o.delay || 0.15) * (0.5 + o.r());
    const before = G.tx; botCore(G, o); G.tx += (o.r() - 0.5) * (o.jit || 1.2);
    return;
  }
  botCore(G, o);
}
function botCore(G, o) {
  // 1) Yakın kapı varsa iyi tarafı seç
  const g = G.gates.find(g => !g.passed && G.z - g.z < 30 && G.z - g.z > -1);
  if (g) { const l = M.applyOp(G.count, g.L), r = M.applyOp(G.count, g.R); let left = l >= r;
    // insanlar bariz farkı kaçırmaz, yakın seçeneklerde yanılır
    const ratio = Math.max(l, r) / Math.max(1, Math.min(l, r));
    if (o.r && o.r() < (o.wrong || 0) / (1 + 2 * (ratio - 1))) left = !left; G.tx = left ? -3 : 3; return; }
  // 2) Önündeki yapıya: eritebiliyorsa hizalan, eritemiyorsa kaç
  const dps = (G.count + G.heroes * M.HERO_POW) * G.st.dmg * M.WEAPONS[G.wTier].m * G.st.rate;
  const ahead = G.objs.filter(o => o.alive && o.z < G.z && G.z - o.z < 30).sort((a, b) => b.z - a.z);
  const wall = ahead.find(o => (o.t === 'barricade' || o.t === 'pedestal') && G.z - o.z < 14 && o.hp / Math.max(1, dps * 0.5) > (G.z - o.z) / 9);
  if (wall) { G.tx = wall.x > 0 ? -6 : 6; return; }
  for (const o of ahead) {
    const tReach = (G.z - o.z) / 9;
    if (o.t === 'pedestal' || o.t === 'block') {
      if (o.hp / Math.max(1, dps * 0.6) < tReach * 0.85) { G.tx = o.x; return; }
      G.tx = o.x > 0 ? -3.5 : 3.5; return;
    }
    if (o.t === 'barricade') { G.tx = o.x > 0 ? -3 : 3; return; }
    if (o.t === 'squad' || o.t === 'boss') { G.tx = o.x; return; }
  }
  G.tx = 0;
}

module.exports = { bot };
