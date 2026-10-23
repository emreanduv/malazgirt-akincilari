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
  // 1b) Mancınık halkası yaklaşıyorsa halkadan uzaklaş
  const tas = G.objs.find(o => o.alive && o.t === 'tas' && G.z - o.z < 14 && G.z - o.z > -1);
  if (tas && Math.abs(G.x - tas.x) < tas.r + G.Rx * 0.35 + 0.4) { const gap = tas.r + G.Rx * 0.35 + 0.7; G.tx = tas.x > 0 ? tas.x - gap : tas.x + gap; return; }
  // 1b2) Gülle şeridindeysen çekil
  const gl = G.objs.find(o => o.alive && !o.done && o.t === 'gulle' && o.warn && o.z < G.z && Math.abs(G.x - o.x) < o.r + G.Rx * 0.5 + 0.4);
  if (gl) { const gap = gl.r + G.Rx * 0.5 + 0.8; let tx = gl.x > G.x ? gl.x - gap : gl.x + gap; if (Math.abs(tx) > 5) tx = gl.x > 0 ? gl.x - gap : gl.x + gap; G.tx = tx; return; }
  // 1c) Hendek yaklaşıyorsa köprüye hizalan
  const hd = G.objs.find(o => o.alive && o.t === 'hendek' && G.z - o.z < 16 && G.z - o.z > -1);
  if (hd) { G.tx = hd.bx; return; }
  // 2) Önündeki yapıya: eritebiliyorsa hizalan, eritemiyorsa kaç
  const dps = (G.count + G.heroes * M.HERO_POW) * G.st.dmg * M.WEAPONS[G.wTier].m * G.st.rate;
  const ahead = G.objs.filter(o => o.alive && o.t !== 'tas' && o.t !== 'gecit' && o.t !== 'kervan' && o.t !== 'hendek' && o.t !== 'gulle' && o.t !== 'sur' && o.z < G.z && G.z - o.z < 30).sort((a, b) => b.z - a.z);
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
