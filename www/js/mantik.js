/* Malazgirt Akıncıları — oyun mantığı (çizimden bağımsız).
   Tarayıcıda window.MANTIK olarak, Node'da require() ile kullanılır (denge testi: araclar/denge-testi.js). */
(function (root) {
'use strict';

/* ---------- yardımcılar ---------- */
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- sabitler ---------- */
const ROAD = 6;            // yolun yarı genişliği
const SPEED = 9;           // ileri yürüyüş hızı
const ARROW_V = 44, ARROW_LIFE = 0.75;   // ok menzili ≈ 33
const HERO_POW = 20, HERO_HP = 15, MAX_HERO = 3;
const MAX_COUNT = 999;

const WEAPONS = [
  { ad: 'Sade Yay', m: 1, c: 0xf4ead2 },
  { ad: 'Kemankeş Yayı', m: 1.6, c: 0x8ff0f3 },
  { ad: 'Çifte Yay', m: 2.4, c: 0xa8d8ff },
  { ad: 'Ateşli Ok', m: 3.4, c: 0xff9a3c },
  { ad: 'Gök Tuğ Yayı', m: 4.6, c: 0xffe066 }
];

/* Bizans birlikleri. p = çatışmada bir erin kaç akıncı götürdüğü, hp = kaç ok gücüyle düştüğü */
const FOES = {
  piyade:    { ad: 'Bizans Piyadesi', hp: 1.0, p: 1.0, v: 4.2 },
  okcu:      { ad: 'Bizans Okçusu',   hp: 0.8, p: 0.6, v: 0,   ates: 0.05 },
  katafrakt: { ad: 'Katafrakt',       hp: 2.6, p: 2.4, v: 7.5 },
  varang:    { ad: 'Varang Muhafızı', hp: 2.0, p: 1.9, v: 3.2 }
};
const FOE_UNLOCK = { piyade: 0, okcu: 11, katafrakt: 19, varang: 31 };

const UPG = [
  { k: 'start', ad: 'Akıncı Ocağı',  base: 45, desc: l => (3 + 2 * l) + ' akıncıyla yola çık' },
  { k: 'dmg',   ad: 'Ok Ucu',        base: 55, desc: l => 'Ok gücü ×' + (1 + 0.15 * l).toFixed(2) },
  { k: 'rate',  ad: 'Kemankeşhane',  base: 65, desc: l => 'Atış hızı ×' + (1 + 0.1 * l).toFixed(1) },
  { k: 'zirh',  ad: 'Zırhçı Ocağı',  base: 75, desc: l => 'Çatışma kaybı −%' + Math.round(100 * zirhOf(l)) }
];
const UPMAX = 10;
function zirhOf(l) { return Math.min(0.45, 0.045 * l); }
function upCost(u, l) { return Math.round(u.base * Math.pow(1.42, l)); }
function stats(up) {
  return { start: 3 + 2 * (up.start || 0), dmg: 1 + 0.15 * (up.dmg || 0), rate: 1 + 0.1 * (up.rate || 0), zirh: zirhOf(up.zirh || 0) };
}

/* ---------- sefer haritası: 5 bölge × 10 bölüm ---------- */
const REGIONS = [
  { ad: 'Fırat Boyları', alt: 'Halep\'ten kuzeye',
    names: ['Halep Kapısı', 'Menbiç Yolu', 'Fırat Geçidi', 'Urfa Ovası', 'Harran Surları', 'Siverek Tepeleri', 'Karacadağ', 'Diyarbekir Önleri', 'Silvan Yolu', 'Hasankeyf Köprüsü'],
    bosses: ['kumandan', 'duka'],
    lines: ['Sultan Alparslan Halep kuşatmasını kaldırdı. Akıncılar kuzeye, Bizans ordusunun önüne gönderildi.',
            'Fırat\'ın suyu bulanık, yollar uzun. Sancağı yüksek tut, akıncıları dağıtma.',
            'Keşif kolu ileride Bizans öncülerini gördü. Önce okla karşıla, sonra dal.'] },
  { ad: 'Azerbaycan Yaylaları', alt: 'Hoy\'da ordu toplanıyor',
    names: ['Hoy Ordugâhı', 'Selmas Geçidi', 'Urmiye Kıyısı', 'Maku Boğazı', 'Ağrı Eteği', 'Diyadin Sıcak Suları', 'Doğubeyazıt Yaylası', 'Patnos Düzü', 'Tendürek Yamacı', 'Erciş Kalesi'],
    bosses: ['kumandan', 'strategos'],
    lines: ['Yaylalardan Türkmen boyları katılıyor. Her kapıdan doğru tarafı seç, ordu büyüsün.',
            'Rüzgâr sert, oklar sapmasın. Kemankeşlere iyi yay bul.',
            'Bizans okçuları tepelere dizilmiş. Menzillerine girmeden önce oklarını konuştur.'] },
  { ad: 'Van Gölü Kıyısı', alt: 'Ahlat\'tan batıya',
    names: ['Ahlat Kümbetleri', 'Adilcevaz Limanı', 'Süphan Eteği', 'Tatvan Yolu', 'Nemrut Kalderası', 'Gevaş Bahçeleri', 'Van Kalesi Önü', 'Muradiye Şelalesi', 'Ercek Gölü', 'Çaldıran Ovası'],
    bosses: ['strategos', 'katafraktbasi'],
    lines: ['Göl kıyısında ağır zırhlı Katafraktlar görüldü. Atlarına ok yağdır, yakına gelmesinler.',
            'Ahlat\'ın taş ustaları sancağımızı bekliyor. Yolu aç, Akıncı Bey.',
            'Düşman kazıklı barikatlar dikmiş. Okla kır ya da öbür yandan dolaş.'] },
  { ad: 'Murat Vadisi', alt: 'Malazgirt\'e son konaklar',
    names: ['Bulanık Köprüsü', 'Hınıs Geçidi', 'Varto Sırtları', 'Murat Kıyısı', 'Muş Ovası', 'Karlıova', 'Tekman Yaylası', 'Liz Ormanı', 'Zernak Tepesi', 'Çökek Pınarı'],
    bosses: ['katafraktbasi', 'varangbasi'],
    lines: ['İmparatorun Varang Muhafızları vadiye indi. Baltaları ağır, sabırlı ol.',
            'Murat\'ın suyu soğuk, akıncının yüreği sıcak. Kapıları akıllı seç.',
            'Bizans ordusu bölündü. Önündeki kolu dağıt, ana orduya yol aç.'] },
  { ad: 'Malazgirt Ovası', alt: '26 Ağustos 1071',
    names: ['Malazgirt Kalesi', 'Ahlat Yolu', 'Rahva Düzü', 'Cuma Namazı', 'Hilal Tuzağı', 'Geri Çekiliş', 'Kanatlar Kapanıyor', 'Karargâh Çadırları', 'Varang Hattı', 'İmparatorun Sancağı'],
    bosses: ['varangbasi', 'imparator'],
    lines: ['Sultan beyaz giydi: "Bugün ya zafer ya şehadet." Akıncılar hilal düzenine geçiyor.',
            'Geri çekilir gibi yap, düşmanı içeri çek, sonra kanatlardan kapan.',
            'Ova toz duman. Sancağı düşürme, Anadolu\'nun kapısı bu ovada açılacak.'] }
];
const BOSSES = {
  kumandan:      { ad: 'Öncü Kumandanı',     tip: 'piyade',    renk: 0xb8323a },
  duka:          { ad: 'Urfa Dukası',          tip: 'piyade',    renk: 0x8e1f5c },
  strategos:     { ad: 'Strategos',            tip: 'piyade',    renk: 0x6d2b8f },
  katafraktbasi: { ad: 'Katafrakt Başbuğu',    tip: 'katafrakt', renk: 0x5a6470 },
  varangbasi:    { ad: 'Varang Başı',          tip: 'varang',    renk: 0x3b4a5e },
  imparator:     { ad: 'İmparator Muhafızı',   tip: 'varang',    renk: 0x6a1b7a }
};
const BOSS_TXT = {
  kumandan: 'Bölümün sonunda Öncü Kumandanı bekliyor. Dev gibi; ok yağmuruyla erit.',
  duka: 'Urfa Dukası kendi alayıyla yolu kesti. Kapılardan büyük çıkman gerek.',
  strategos: 'Bizans Strategos\'u ordusunun başında. Silahını güçlendirmeden yaklaşma.',
  katafraktbasi: 'Katafrakt Başbuğu demir zırhlı atıyla geliyor. Ateşli Ok bulursan çok işe yarar.',
  varangbasi: 'Varang Başı, imparatorun baltalı muhafızı. Çatışmaya girmeden önce yarısını düşür.',
  imparator: 'İmparator Romen Diyojen\'in Muhafız Alayı karşında. Bu son hamle, Akıncı Bey.'
};
const UNLOCK_TXT = {
  2: 'Kaidelerin üstündeki sayıyı okla sıfırla: yeni yay, tuğ ya da Altın Alp senin olur.',
  5: 'Altın Alp kaideleri çıktı. Alp\'ler ordunun önünde yürür, tek başına yirmi akıncı gücünde ok atar.',
  8: 'Kazıklı barikatlar başladı. Çarparsan akıncı kaybedersin; okla kır ya da yanından geç.',
  11: 'Bizans okçuları ilk kez sahada. Yerinden kıpırdamaz, menzile girince ok atar. Önce sen vur.',
  14: 'Bazı kapılarda iki yol da kötü. Az zararlı olanı seç.',
  19: 'Katafraktlar geldi: ağır zırhlı, hızlı süvari. Okla erken karşıla.',
  31: 'Varang Muhafızları sahada: imparatorun baltalı seçkin askerleri.'
};

/* ---------- bölüm üretimi ---------- */
function nominalUp(i) { const u = Math.min(10, i * 0.2); return { start: u, dmg: u, rate: u, zirh: u * 0.8 }; }

function foeTypeAt(i, r) {
  const pool = [];
  for (const id in FOE_UNLOCK) if (FOE_UNLOCK[id] <= i && id !== 'okcu') pool.push(id);
  const w = pool.map(id => id === 'piyade' ? Math.max(0.35, 1 - (i - 0) / 60) : id === 'katafrakt' ? 0.8 : 0.9);
  let s = w.reduce((a, b) => a + b, 0), x = r * s;
  for (let k = 0; k < pool.length; k++) { x -= w[k]; if (x <= 0) return pool[k]; }
  return pool[0];
}

function buildLevel(i, f) {
  if (f === undefined) f = CAL[i] || 1;
  const rnd = rng(i * 7919 + 71);
  const d = i / 49, reg = Math.floor(i / 10), k = i % 10, R = REGIONS[reg];
  const st = stats(nominalUp(i));
  const base = (0.78 + 0.62 * d) * Math.min(1, f);   // yapılar (blok, kaide, barikat)
  const hard = base * f;                  // düşmanlar: her bölüm bir tık daha zor (f: araclar/kalibre.js)
  let e = st.start, t = 0, h = 0;
  const dps = () => (e + h * HERO_POW) * st.dmg * WEAPONS[t].m * st.rate;
  const hm = () => +(st.dmg * WEAPONS[t].m * st.rate).toFixed(2);   // düşman erinin ok direnci, oyuncunun beklenen gücüyle büyür
  const objs = [], gates = [];
  const nSeg = Math.min(16, 7 + Math.floor(i / 4));
  let z = -30, last = '', badLeft = i >= 40 ? 2 : 1, lastGateBad = false;
  for (let s = 0; s < nSeg; s++) {
    let type;
    if (s === 0) type = 'blocks';
    else if (s % 2 === 1) type = rnd() < 0.85 ? 'gate' : 'blocks';
    else {
      const opts = [['gate', 0.6], ['blocks', 2], ['squad', i >= 1 ? 2.2 + d : 0], ['pedestal', i >= 2 ? 1.6 : 0],
        ['barricade', i >= 8 ? 1 + d : 0], ['archers', i >= 11 ? 1 + d : 0]];
      let sum = opts.reduce((a, o) => a + o[1], 0), x = rnd() * sum;
      type = 'gate';
      for (const o of opts) { x -= o[1]; if (x <= 0) { type = o[0]; break; } }
      if (type === last && type !== 'gate') type = 'gate';
    }
    last = type;
    if (type === 'blocks') {
      const side = rnd() < 0.5 ? -1 : 1, x = side * 3.6, n = 5 + Math.floor(rnd() * 4);
      const reward = Math.max(1, Math.round(e * 0.06)), hp = Math.max(1, Math.round(dps() * 0.3 * base));
      for (let j = 0; j < n; j++) objs.push({ t: 'block', x, z: z - j * 2.3, hp, reward });
      e += n * reward * 0.8;
      if (s > 1 && rnd() < 0.5 && i >= 2) {
        const pd = pedestalFor(i, rnd, t, h, e, dps(), base); pd.x = -side * 2.6; pd.z = z - 8; objs.push(pd);
        ({ t, h, e } = applyPed(pd, t, h, e));
      }
    } else if (type === 'gate') {
      const plus = { op: '+', v: Math.round(3 + e * 0.35) }, mul = { op: 'x', v: e < 15 ? 3 : 2 };
      const minus = { op: '-', v: Math.max(2, Math.round(e * 0.3)) }, div = { op: '/', v: 2 };
      let pair;
      const r = rnd();
      if (i >= 14 && badLeft > 0 && lastGateBad === false && s > 2 && r < 0.3) { pair = [minus, div]; badLeft--; } // ikisi de kötü
      else if (r < 0.62) pair = [rnd() < 0.5 ? plus : mul, rnd() < 0.5 ? minus : div];
      else pair = [plus, mul];
      lastGateBad = pair[0].op === '-' || pair[0].op === '/' ? (pair[1].op === '-' || pair[1].op === '/') : false;
      if (rnd() < 0.5) pair.reverse();
      gates.push({ z, L: pair[0], R: pair[1] });
      e = Math.min(MAX_COUNT, Math.max(applyOp(e, pair[0]), applyOp(e, pair[1])));
    } else if (type === 'squad') {
      const ft = foeTypeAt(i, rnd()), F = FOES[ft];
      const n = Math.max(3, Math.round(e * 2.2 * hard / F.p));
      objs.push({ t: 'squad', ft, x: (rnd() - 0.5) * 5, z, n, hm: hm() });
      const shot = dps() * 2.5 / F.hp / hm();
      e = Math.max(1, e - Math.max(0, n - shot) * F.p * (1 - st.zirh));
    } else if (type === 'pedestal') {
      const pd = pedestalFor(i, rnd, t, h, e, dps(), base); pd.x = (rnd() < 0.5 ? -1 : 1) * (2 + rnd() * 1.4); pd.z = z; objs.push(pd);
      ({ t, h, e } = applyPed(pd, t, h, e));
    } else if (type === 'barricade') {
      const side = rnd() < 0.5 ? -1 : 1;
      objs.push({ t: 'barricade', x: side * 3, z, w: 6, hp: Math.round(dps() * 0.7 * base) });
      if (i >= 24 && rnd() < 0.6) {                                       // öbür yanda küçük kol
        const ft = foeTypeAt(i, rnd()), F = FOES[ft], n = Math.max(3, Math.round(e * 1.2 * hard / F.p));
        objs.push({ t: 'squad', ft, x: -side * 3, z: z - 3, n, hm: hm() });
        e = Math.max(1, e - Math.max(0, n - dps() * 1.5 / F.hp / hm()) * F.p * (1 - st.zirh));
      }
    } else if (type === 'archers') {
      const n = Math.max(4, Math.round(e * 1.4 * hard));
      objs.push({ t: 'squad', ft: 'okcu', x: (rnd() < 0.5 ? -1 : 1) * (1.5 + rnd() * 2.5), z: z - 6, n, hm: hm() });
      e = Math.max(1, e - n * 0.22 * (1 - st.zirh));
    }
    z -= 26;
  }
  let boss = null, finalSquad;
  const bossZ = z - 6;
  if (k === 4 || k === 9) {
    const id = R.bosses[k === 4 ? 0 : 1];
    const guard = Math.max(4, Math.round(e * 1.8 * hard / FOES[BOSSES[id].tip].p));
    objs.push({ t: 'squad', ft: BOSSES[id].tip, x: 0, z: bossZ + 14, n: guard, hm: hm() });
    e = Math.max(1, e - Math.max(0, guard - dps() * 2 / FOES[BOSSES[id].tip].hp / hm()) * FOES[BOSSES[id].tip].p * (1 - st.zirh));
    const hp = Math.round(dps() * (3 + 3 * d) * hard * (id === 'imparator' ? 1.4 : 1));
    boss = { t: 'boss', id, x: 0, z: bossZ, hp, kill: Math.max(3, e * 0.07 * hard) };
    objs.push(boss);
  } else {
    const ft = i < 6 ? 'piyade' : foeTypeAt(i, rnd());
    const n = Math.max(5, Math.round(e * (2.8 + 0.8 * d) * hard / FOES[ft].p + i));
    finalSquad = { t: 'squad', ft, x: 0, z: bossZ, n, final: true, hm: hm() };
    objs.push(finalSquad);
  }
  let brief = UNLOCK_TXT[i] || '';
  if (boss) brief = (brief ? brief + ' ' : '') + BOSS_TXT[boss.id];
  if (!brief) brief = R.lines[k % 3];
  if (i === 0) brief = 'Sultan Alparslan\'ın akıncıları yola çıktı. Parmağını kaydır, artı kapılardan geç, mavi blokları okla kır. Sondaki Bizans öncülerini dağıt.';
  return { i, reg, k, ad: R.names[k], brief, objs, gates, endZ: bossZ, len: -bossZ + 40, boss: !!boss, reward: 60 + 10 * i };
}
function pedestalFor(i, rnd, t, h, e, dps, hard) {
  let kind = 'troops';
  if (t < 4 && (rnd() < 0.62 || i < 5)) kind = 'weapon';
  else if (i >= 5 && h < MAX_HERO) kind = 'hero';
  const hp = Math.round(dps * (kind === 'hero' ? 1.3 : 1.0) * hard);
  return { t: 'pedestal', kind, val: kind === 'weapon' ? t + 1 : Math.round(e * 0.4), hp };
}
function applyPed(pd, t, h, e) {
  if (pd.kind === 'weapon') t = Math.max(t, pd.val); else if (pd.kind === 'hero') h = Math.min(MAX_HERO, h + 1); else e = Math.min(MAX_COUNT, e + pd.val);
  return { t, h, e };
}
function applyOp(c, o) {
  const r = o.op === '+' ? c + o.v : o.op === 'x' ? c * o.v : o.op === '-' ? c - o.v : Math.ceil(c / o.v);
  return clamp(Math.round(r), 0, MAX_COUNT);
}

/* Kalibrasyon katsayıları: araclar/kalibre.js üretir */
const CAL = [0.693,0.848,0.832,0.739,0.692,0.828,0.643,0.937,0.742,0.896,0.794,1.059,0.856,1.412,2.996,2.108,2.996,0.814,1.552,1.731,0.833,0.722,0.7,0.712,0.582,0.622,0.615,0.536,0.512,0.771,0.753,0.571,0.636,0.469,0.726,0.503,0.562,0.617,0.734,0.662,0.553,0.673,0.435,0.614,0.575,0.401,0.384,0.78,0.374,0.57];
const LEVELS = [];
for (let i = 0; i < 50; i++) LEVELS.push(buildLevel(i));

/* ---------- oyun durumu ve adım fonksiyonu ---------- */
function newGame(i, up) {
  const L = LEVELS[i], st = stats(up), r = rng(i * 31 + 7);
  const G = {
    L, st, rnd: r, i, state: 'play', t: 0, z: 0, x: 0, tx: 0, count: st.start, peak: st.start, heroes: 0, heroHp: 0, wTier: 0,
    fireT: 0, arrows: [], foeShots: [], objs: [], gates: [], events: [], kills: 0, clash: false, march: 0, Rx: 0.5, Rz: 0.5
  };
  for (const o of L.objs) {
    const c = Object.assign({}, o, { alive: true, max: o.hp || o.n, acc: 0, flash: 0 });
    if (c.t === 'block') { c.w = 1.7; c.d = 1.1; }
    if (c.t === 'pedestal') { c.w = 2.5; c.d = 1.5; }
    if (c.t === 'barricade') { c.d = 1.0; }
    if (c.t === 'boss') { c.w = 3.4; c.d = 2.4; }
    if (c.t === 'squad') { c.start = c.n; c.fireAcc = 0; }
    G.objs.push(c);
  }
  for (const g of L.gates) G.gates.push(Object.assign({ passed: false, side: 0 }, g));
  return G;
}
const crowdR = n => 0.34 * Math.sqrt(clamp(n, 1, 220));
function totalPow(G) { return (G.count + G.heroes * HERO_POW) * G.st.dmg * WEAPONS[G.wTier].m; }
function ev(G, type, data) { G.events.push(Object.assign({ type }, data)); }

function loseSoldiers(G, k) {
  if (k <= 0) return;
  const c = Math.min(k, G.count); G.count -= c; k -= c;
  if (k > 0 && G.heroes > 0) { G.heroHp -= k; G.heroes = Math.max(0, Math.ceil(G.heroHp / HERO_HP)); if (G.heroes === 0) G.heroHp = 0; }
}
function foeDims(o) {
  const m = Math.min(o.n, o.ft === 'katafrakt' ? 90 : 160);
  const sx = o.ft === 'katafrakt' ? 0.8 : 0.55, sz = o.ft === 'katafrakt' ? 1.1 : 0.6;
  o.cols = Math.max(1, Math.min(o.ft === 'katafrakt' ? 8 : 12, Math.ceil(Math.sqrt(m * 1.3))));
  o.rows = Math.ceil(m / o.cols); o.w = o.cols * sx + 0.5; o.d = o.rows * sz + 0.5;
}

function fire(G, dt) {
  const total = G.count + G.heroes; if (total <= 0) return;
  const iv = 0.12 / G.st.rate; G.fireT += dt;
  while (G.fireT >= iv) {
    G.fireT -= iv;
    const n = Math.min(total, 10), each = totalPow(G) * 0.12 / n, shown = Math.min(G.count, 220);
    for (let k = 0; k < n; k++) {
      let x, y, z;
      if (G.heroes > 0 && (k < G.heroes || shown === 0)) { const j = k % G.heroes; x = G.x + (j - (G.heroes - 1) / 2) * 1.4; y = 2.2; z = G.z - G.Rz - 1.2; }
      else { const j = Math.floor(G.rnd() * Math.max(shown, 1)), a = j * 2.39996, r = 0.34 * Math.sqrt(j); x = G.x + Math.cos(a) * r * 0.85; y = 0.95; z = G.z + Math.sin(a) * r * 1.15 - 0.3; }
      G.arrows.push({ x, y, z, pz: z, dmg: each, life: ARROW_LIFE });
    }
  }
}
function hitObj(G, o, dmg) {
  if (o.t === 'block' || o.t === 'pedestal' || o.t === 'barricade' || o.t === 'boss') {
    o.hp -= dmg; o.flash = 0.1;
    if (o.hp <= 0) killObj(G, o, true);
  } else {
    o.acc += dmg; const F = FOES[o.ft], uh = F.hp * (o.hm || 1), k = Math.floor(o.acc / uh);
    if (k > 0) { o.acc -= k * uh; const kk = Math.min(k, o.n); o.n -= kk; G.kills += kk; ev(G, 'hit', { x: o.x, z: o.z + o.d / 2 }); if (o.n <= 0) killObj(G, o, false); }
  }
}
function killObj(G, o, give) {
  o.alive = false; o.hp = 0;
  ev(G, 'break', { o });
  if (!give) return;
  if (o.t === 'block') { G.count = Math.min(MAX_COUNT, G.count + o.reward); ev(G, 'gain', { x: o.x, z: o.z, v: o.reward }); }
  else if (o.t === 'pedestal') {
    if (o.kind === 'weapon') { G.wTier = Math.min(4, Math.max(G.wTier, o.val)); ev(G, 'weapon', { x: o.x, z: o.z, w: G.wTier }); }
    else if (o.kind === 'hero') { if (G.heroes < MAX_HERO) { G.heroes++; G.heroHp = G.heroes * HERO_HP; } ev(G, 'hero', { x: o.x, z: o.z }); }
    else { G.count = Math.min(MAX_COUNT, G.count + o.val); ev(G, 'troops', { x: o.x, z: o.z, v: o.val }); }
  }
}

function step(G, dt) {
  G.events.length = 0;
  if (G.state === 'win' || G.state === 'lose') return;
  G.t += dt;
  G.Rz = crowdR(G.count) * 1.15 + 0.3; G.Rx = crowdR(G.count) * 0.85 + 0.3;
  if (G.state === 'march') {
    G.z -= 7 * dt; G.x += (0 - G.x) * Math.min(1, dt * 3); G.march += dt; G.arrows.length = 0;
    if (G.march > 1.8) G.state = 'win';
    return;
  }
  let speed = SPEED; if (G.clash) speed = 2.2; if (G.atBoss) speed = 0.4;
  G.clash = false; G.atBoss = false;
  G.z -= speed * dt;
  const lim = Math.max(0, ROAD - 0.4 - G.Rx);
  G.tx = clamp(G.tx, -lim, lim);
  G.x += (G.tx - G.x) * Math.min(1, dt * 10); G.x = clamp(G.x, -lim, lim);
  if (G.z < G.L.endZ + G.Rz + 1) G.z = G.L.endZ + G.Rz + 1;

  fire(G, dt);
  // oklar
  const near = G.objs.filter(o => o.alive && o.z < G.z + 2 && o.z > G.z - 40);
  for (const o of near) if (o.t === 'squad') foeDims(o);
  for (let a = G.arrows.length - 1; a >= 0; a--) {
    const A = G.arrows[a]; A.pz = A.z; A.z -= ARROW_V * dt; A.life -= dt;
    let dead = A.life <= 0;
    if (!dead) for (const o of near) {
      if (!o.alive || Math.abs(A.x - o.x) > o.w / 2) continue;
      const zf = o.z + o.d / 2, zb = o.z - o.d / 2;
      if (A.z > zf || A.pz < zb) continue;
      hitObj(G, o, A.dmg); dead = true; break;
    }
    if (dead) G.arrows.splice(a, 1);
  }
  // nesneler
  for (const o of G.objs) {
    if (!o.alive) continue;
    o.flash = Math.max(0, o.flash - dt);
    const dist = G.z - o.z;
    if (o.t === 'block' || o.t === 'pedestal' || o.t === 'barricade') {
      if (Math.abs(o.x - G.x) < o.w / 2 + G.Rx * 0.7 && Math.abs(o.z - G.z) < o.d / 2 + G.Rz * 0.7) {
        const per = 2 * G.st.dmg * WEAPONS[G.wTier].m;
        let loss = Math.ceil(o.hp / per); loss = Math.max(1, Math.min(loss, Math.ceil(G.count * 0.25) + 2));
        if (o.t === 'block') loss = Math.min(loss, 3);
        loseSoldiers(G, loss); ev(G, 'crash', { x: G.x, z: G.z, v: loss });
        killObj(G, o, false);
      }
      continue;
    }
    if (o.t === 'boss') {
      const touching = (G.z - G.Rz) <= o.z + o.d / 2 + 0.2;
      if (dist < 32 && !touching) o.z += 2 * dt;
      if (touching) {
        G.atBoss = true; o.acc += o.kill * (1 - G.st.zirh) * dt;
        const k = Math.floor(o.acc); if (k > 0) { o.acc -= k; loseSoldiers(G, k); ev(G, 'bossHit', { x: G.x, z: G.z - G.Rz }); }
      }
      continue;
    }
    // birlik
    const F = FOES[o.ft];
    foeDims(o);
    const touching = (G.z - G.Rz) <= o.z + o.d / 2 + 0.2 && (G.z + G.Rz) >= o.z - o.d / 2 && Math.abs(o.x - G.x) < o.w / 2 + G.Rx;
    if (F.v > 0 && dist < 42 && !touching && dist > -2) { o.z += F.v * dt; o.x += (G.x - o.x) * 0.3 * dt; }
    if (F.ates && dist > 0 && dist < 30) {
      o.fireAcc += o.n * F.ates * (1 - G.st.zirh) * dt;
      const k = Math.floor(o.fireAcc); if (k > 0) { o.fireAcc -= k; loseSoldiers(G, k); ev(G, 'shot', { from: o, v: k }); }
      if (G.rnd() < dt * Math.min(8, o.n * 0.4)) G.foeShots.push({ x: o.x + (G.rnd() - 0.5) * o.w, z: o.z, tx: G.x + (G.rnd() - 0.5) * G.Rx * 2, tz: G.z, t: 0 });
    }
    if (touching) {
      G.clash = true; if (o.final) G.atBoss = true;
      const rate = Math.max(14, (G.count + o.n) * 1.4);
      o.acc += rate * dt; const k = Math.floor(o.acc);
      if (k > 0) {
        o.acc -= k; const kk = Math.min(k, o.n); o.n -= kk; G.kills += kk;
        o.lossAcc = (o.lossAcc || 0) + kk * F.p * (1 - G.st.zirh);
        const l = Math.floor(o.lossAcc); o.lossAcc -= l; loseSoldiers(G, l);
        ev(G, 'clash', { x: (o.x + G.x) / 2, z: G.z - G.Rz });
      }
      if (o.n <= 0) killObj(G, o, false);
    }
    if (dist < -14 && o.ft === 'okcu') o.alive = false;   // geride kalan okçular
  }
  for (let s = G.foeShots.length - 1; s >= 0; s--) { G.foeShots[s].t += dt * 1.6; if (G.foeShots[s].t >= 1) G.foeShots.splice(s, 1); }
  // kapılar
  for (const g of G.gates) {
    if (g.passed || G.z - G.Rz * 0.3 > g.z) continue;
    g.passed = true; g.side = G.x < 0 ? -1 : 1;
    const o = g.side < 0 ? g.L : g.R, before = G.count;
    G.count = applyOp(G.count, o);
    ev(G, 'gate', { g, d: G.count - before, x: G.x, z: G.z });
  }
  G.peak = Math.max(G.peak, G.count);
  if (G.count <= 0 && G.heroes <= 0) { G.state = 'lose'; ev(G, 'lose', {}); return; }
  const last = G.objs.find(o => o.t === 'boss' || o.final);
  if (last && !last.alive) { G.state = 'march'; G.march = 0; ev(G, 'win', {}); }
}

function progress(G) { return clamp(G.z / G.L.endZ, 0, 1); }
function starsOf(G) { const r = G.count / Math.max(1, G.peak); return r >= 0.45 ? 3 : r >= 0.2 ? 2 : 1; }
function rewardOf(G, win, firstClear) {
  const L = G.L;
  if (win) return Math.round(L.reward * (firstClear ? 1 : 0.35)) + Math.min(80, Math.floor(G.count / 3));
  return Math.min(Math.round(L.reward * 0.3), 4 + Math.floor(G.kills / 6));
}

const API = { buildLevel, CAL, ROAD, WEAPONS, FOES, UPG, UPMAX, upCost, stats, REGIONS, BOSSES, LEVELS, newGame, step, progress, starsOf, rewardOf, applyOp, crowdR, HERO_POW, MAX_HERO };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.MANTIK = API;
})(typeof window !== 'undefined' ? window : globalThis);
