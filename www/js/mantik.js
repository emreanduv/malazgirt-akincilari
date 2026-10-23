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
const crowdR = n => 0.34 * Math.sqrt(clamp(n, 1, 220));

const WEAPONS = [
  { ad: 'Sade Yay', m: 1, c: 0xf4ead2 },
  { ad: 'Kemankeş Yayı', m: 1.6, c: 0x8ff0f3 },
  { ad: 'Çifte Yay', m: 2.4, c: 0xa8d8ff },
  { ad: 'Ateşli Ok', m: 3.4, c: 0xff9a3c },
  { ad: 'Gök Tuğ Yayı', m: 4.6, c: 0xffe066 },
  { ad: 'Çelik Kirişli Yay', m: 6.2, c: 0xc9f2ff },
  { ad: 'Sultan Yayı', m: 8.2, c: 0xff7ad9 },
  { ad: 'Akkiriş Yayı', m: 10.8, c: 0xffffff },
  { ad: 'Gazi Yayı', m: 14, c: 0x7dffb0 },
  { ad: 'Yıldırım Yayı', m: 18, c: 0xfff15a },
  { ad: 'Fatih Yayı', m: 23, c: 0xffb04a },
  { ad: 'Kanuni Yayı', m: 29, c: 0xb8f0ff }
];
const TIER_CAP = [4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 11];
const maxTier = i => TIER_CAP[Math.min(TIER_CAP.length - 1, Math.floor(i / 50))];

/* Düşman birlikleri. p = çatışmada bir erin kaç akıncı götürdüğü, hp = kaç ok gücüyle düştüğü, atli = süvari */
const FOES = {
  piyade:    { ad: 'Bizans Piyadesi',     hp: 1.0, p: 1.0, v: 4.2 },
  okcu:      { ad: 'Bizans Okçusu',       hp: 0.8, p: 0.6, v: 0,   ates: 0.05 },
  katafrakt: { ad: 'Katafrakt',           hp: 2.6, p: 2.4, v: 7.5, atli: 1 },
  varang:    { ad: 'Varang Muhafızı',     hp: 2.0, p: 1.9, v: 3.2 },
  akrit:     { ad: 'Akrit Süvarisi',      hp: 1.5, p: 1.4, v: 10,  atli: 1 },
  frank:     { ad: 'Haçlı Piyadesi',      hp: 1.2, p: 1.1, v: 4.0 },
  arbalet:   { ad: 'Arbaletçi',           hp: 1.0, p: 0.7, v: 0,   ates: 0.065 },
  sovalye:   { ad: 'Şövalye',             hp: 3.2, p: 3.0, v: 6.5, atli: 1 },
  kalkanli:  { ad: 'Kalkanlı Ağır Piyade', hp: 3.0, p: 1.5, v: 3.0 },
  latin:     { ad: 'Latin Paralı Askeri', hp: 1.4, p: 1.3, v: 4.2 },
  alan:      { ad: 'Alan Süvarisi',       hp: 2.0, p: 1.8, v: 9,   atli: 1 },
  katalan:   { ad: 'Katalan Paralı Askeri', hp: 2.2, p: 2.0, v: 4.5 },
  sirppiyade:{ ad: 'Sırp Piyadesi',       hp: 1.5, p: 1.3, v: 4.0 },
  sirpsovalye:{ ad: 'Sırp Ağır Süvarisi',  hp: 3.4, p: 3.2, v: 6.5, atli: 1 },
  macar:     { ad: 'Macar Süvarisi',      hp: 2.6, p: 2.4, v: 8,   atli: 1 },
  tufekci:   { ad: 'Araba Tüfekçisi',     hp: 1.2, p: 0.8, v: 0,   ates: 0.08 },
  ceneviz:   { ad: 'Ceneviz Zırhlısı',    hp: 2.4, p: 2.1, v: 3.6 },
  venedik:   { ad: 'Venedik Piyadesi',    hp: 1.8, p: 1.6, v: 4.2 },
  arkebuz:   { ad: 'Arkebüzcü',           hp: 1.3, p: 0.8, v: 0,   ates: 0.09 },
  hirvat:    { ad: 'Hırvat Piyadesi',     hp: 2.0, p: 1.8, v: 4.0 },
  zirhli:    { ad: 'Zırhlı Macar Şövalyesi', hp: 4.2, p: 3.8, v: 6.5, atli: 1 },
  rodos:     { ad: 'Rodos Şövalyesi',     hp: 3.8, p: 3.2, v: 3.0 },
  husar:     { ad: 'Macar Hafif Süvarisi', hp: 2.4, p: 2.2, v: 10.5, atli: 1 },
  landsknecht:{ ad: 'Alman Paralı Askeri', hp: 2.6, p: 2.3, v: 4.2 }
};
/* her seferde sahaya çıkan birlikler: [birlik, ilk bölüm (genel sıra)] */
const POOLS = [
  [['piyade', 0], ['katafrakt', 19], ['varang', 31]],
  [['piyade', 50], ['katafrakt', 50], ['varang', 50], ['akrit', 50]],
  [['frank', 100], ['sovalye', 103]],
  [['piyade', 150], ['katafrakt', 150], ['varang', 150], ['kalkanli', 150]],
  [['latin', 200], ['katafrakt', 200], ['akrit', 200], ['kalkanli', 205]],
  [['piyade', 250], ['katafrakt', 250], ['kalkanli', 250], ['varang', 250], ['alan', 250]],
  [['piyade', 300], ['kalkanli', 300], ['varang', 300], ['katalan', 300], ['alan', 300]],
  [['sirppiyade', 350], ['sirpsovalye', 353], ['kalkanli', 350]],
  [['frank', 400], ['sovalye', 400], ['macar', 400]],
  [['frank', 450], ['sovalye', 450], ['macar', 450]],
  [['piyade', 500], ['ceneviz', 500], ['kalkanli', 500], ['venedik', 510]],
  [['venedik', 550], ['sirppiyade', 550], ['macar', 550], ['ceneviz', 550], ['sirpsovalye', 555]],
  [['hirvat', 600], ['macar', 600], ['zirhli', 603], ['rodos', 630]],
  [['hirvat', 650], ['husar', 650], ['zirhli', 650], ['landsknecht', 655]],
  [['landsknecht', 700], ['husar', 700], ['zirhli', 700], ['hirvat', 700]]
];
const ARCHER = ['okcu', 'okcu', 'arbalet', 'okcu', 'arbalet', 'okcu', 'okcu', 'okcu', 'arbalet', 'tufekci', 'arbalet', 'arbalet', 'arkebuz', 'arkebuz', 'arkebuz'];
const BASE_FOE = ['piyade', 'akrit', 'frank', 'kalkanli', 'latin', 'piyade', 'piyade', 'sirppiyade', 'frank', 'frank', 'piyade', 'venedik', 'hirvat', 'hirvat', 'landsknecht'];

const UPG = [
  { k: 'start', ad: 'Akıncı Ocağı',  base: 45, desc: l => (3 + 2 * l) + ' akıncıyla yola çık' },
  { k: 'dmg',   ad: 'Ok Ucu',        base: 55, desc: l => 'Ok gücü ×' + (1 + 0.15 * l).toFixed(2) },
  { k: 'rate',  ad: 'Kemankeşhane',  base: 65, desc: l => 'Atış hızı ×' + (1 + 0.1 * l).toFixed(1) },
  { k: 'zirh',  ad: 'Zırhçı Ocağı',  base: 75, desc: l => 'Çatışma kaybı −%' + Math.round(100 * zirhOf(l)) }
];
const UPMAX = 60;
const upCap = sefer => Math.min(UPMAX, 10 + 5 * sefer);   // her yeni sefer Ordugâh'ı 5 basamak açar
function zirhOf(l) { return l <= 10 ? 0.045 * l : l <= 30 ? 0.45 + 0.01 * (l - 10) : Math.min(0.75, 0.65 + 0.004 * (l - 30)); }
function upCost(u, l) { return Math.round(u.base * Math.pow(1.42, Math.min(l, 10)) * Math.pow(1.16, Math.min(20, Math.max(0, l - 10))) * Math.pow(1.07, Math.max(0, l - 30))); }
function stats(up) {
  return { start: 3 + 2 * (up.start || 0), dmg: 1 + 0.15 * (up.dmg || 0), rate: 1 + 0.1 * (up.rate || 0), zirh: zirhOf(up.zirh || 0) };
}

/* ---------- seferler: her sefer 5 bölge × 10 bölüm ---------- */
const SEFERLER = [
  { ad: 'Malazgirt', yil: '1071', alt: 'Sultan Alparslan\'ın seferi', zafer: 'MALAZGİRT!',
    epilog: '26 Ağustos 1071. Bizans ordusu dağıldı, İmparator Romen Diyojen esir düştü. Sultan Alparslan onu bağışlayıp serbest bıraktı. Anadolu\'nun kapıları açıldı.' },
  { ad: 'Anadolu\'ya Akın', yil: '1072–1075', alt: 'Süleyman Şah ile batıya', zafer: 'İZNİK!',
    epilog: '1075. Süleyman Şah İznik\'e girdi ve şehri Anadolu Selçuklu Devleti\'nin ilk başkenti yaptı. Akıncılar Marmara\'nın kıyısına vardı.' },
  { ad: 'Haçlılara Karşı', yil: '1096–1101', alt: 'Sultan Kılıç Arslan\'ın savunması', zafer: 'EREĞLİ!',
    epilog: '1101. Üç büyük Haçlı ordusu Anadolu bozkırında dağıldı. Kılıç Arslan başkentini Konya\'ya taşıdı; Türkmenler Anadolu\'da kök saldı.' },
  { ad: 'Miryokefalon', yil: '1176', alt: 'II. Kılıç Arslan\'ın zaferi', zafer: 'MİRYOKEFALON!',
    epilog: '17 Eylül 1176. Bizans ordusu dağ geçidinde dağıldı. İmparator Manuel barış istedi. Artık Anadolu, Türk yurdudur.' },
  { ad: 'Selçuklu\'nun Zirvesi', yil: '1207–1225', alt: 'İki denize açılan sultanlık', zafer: 'SUĞDAK!',
    epilog: '1225. Antalya, Sinop ve Alanya\'dan sonra Selçuklu akıncıları Karadeniz\'i aşıp Kırım\'a çıktı. Kervansaraylar yolları, tersaneler denizleri tutuyor.' },
  { ad: 'Uç Beylikleri', yil: '1261–1302', alt: 'Söğüt\'ten doğan beylik', zafer: 'KOYUNHİSAR!',
    epilog: '27 Temmuz 1302. Osman Gazi Koyunhisar\'da Bizans ordusunu dağıttı. Uçtaki küçük beylik artık bir devletin kapısını aralıyor.' },
  { ad: 'Rumeli\'ye Geçiş', yil: '1326–1361', alt: 'Orhan Gazi ve Süleyman Paşa', zafer: 'EDİRNE!',
    epilog: 'Bursa başkent oldu, akıncılar sallarla Çanakkale\'yi geçti. Edirne alındı; Rumeli\'nin kapısı ardına kadar açıldı.' },
  { ad: 'Kosova', yil: '1364–1389', alt: 'Sultan I. Murad\'ın seferi', zafer: 'KOSOVA!',
    epilog: '15 Haziran 1389. Kosova Ovası\'nda Balkan ittifakı dağıldı. Sultan Murad şehit düştü; Yıldırım Bayezid ordunun başına geçti.' },
  { ad: 'Niğbolu', yil: '1395–1396', alt: 'Yıldırım Bayezid\'in seferi', zafer: 'NİĞBOLU!',
    epilog: '25 Eylül 1396. Avrupa\'nın en kalabalık Haçlı ordusu Tuna kıyısında dağıldı. Yıldırım Bayezid\'in adı Avrupa\'da duyuldu.' },
  { ad: 'Varna', yil: '1443–1444', alt: 'Sultan II. Murad\'ın seferi', zafer: 'VARNA!',
    epilog: '10 Kasım 1444. Varna\'da son büyük Haçlı ordusu dağıldı. Balkanlar\'ın yolu açıldı; sırada İstanbul var.' },
  { ad: 'İstanbul\'un Fethi', yil: '1452–1453', alt: 'Sultan II. Mehmed\'in seferi', zafer: 'FETİH!',
    epilog: '29 Mayıs 1453. Surlarda açılan gedikten giren ordu şehre girdi. Sultan II. Mehmed artık Fatih; İstanbul yeni başkent oldu. Bir çağ kapandı, yenisi açıldı.' },
  { ad: 'Fatih\'in Seferleri', yil: '1459–1480', alt: 'Mora\'dan Trabzon\'a, Bosna\'dan Otranto\'ya', zafer: 'OTRANTO!',
    epilog: '1480. Gedik Ahmed Paşa İtalya kıyısında Otranto\'ya çıktı. Semendire, Mora, Trabzon, Bosna ve Eğriboz\'dan sonra Fatih\'in sancağı iki denizin kıyısında dalgalanıyor.' },
  { ad: 'Belgrad ve Rodos', yil: '1521–1522', alt: 'Sultan Süleyman\'ın ilk seferleri', zafer: 'RODOS!',
    epilog: 'Aralık 1522. Altı ay süren kuşatmadan sonra Rodos Şövalyeleri adayı bırakıp gitti. Belgrad ve Rodos\'la Tuna\'nın ve Ege\'nin kapıları açıldı.' },
  { ad: 'Mohaç', yil: '1526', alt: 'Kanuni\'nin Macaristan seferi', zafer: 'MOHAÇ!',
    epilog: '29 Ağustos 1526. Mohaç Ovası\'nda Macar ordusu iki saat içinde dağıldı. Kral kaçarken bataklıkta can verdi; Budin\'in kapıları açıldı.' },
  { ad: 'Budin', yil: '1529–1541', alt: 'Tuna boyunda on beş yıl', zafer: 'BUDİN!',
    epilog: '29 Ağustos 1541. Mohaç\'tan tam on beş yıl sonra Sultan Süleyman Budin\'e girdi. Budin artık bir eyaletin merkezi; Tuna boyu Türk sancaklarıyla doldu.' }
];
const SOON = { ad: 'Zigetvar', alt: 'Yeni seferler pek yakında' };

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
            'Ova toz duman. Sancağı düşürme, Anadolu\'nun kapısı bu ovada açılacak.'] },
  /* ---- 2. sefer: Anadolu'ya Akın ---- */
  { ad: 'Kapadokya', alt: 'Kayseri\'den batıya',
    names: ['Kayseri Ovası', 'Erciyes Eteği', 'Talas Bağları', 'Ürgüp Vadisi', 'Göreme Bacaları', 'Nevşehir Yolu', 'Hasandağı', 'Aksaray Hanı', 'Niğde Kalesi', 'Ihlara Kanyonu'],
    bosses: ['akritbeyi', 'kumandan'],
    lines: ['Malazgirt\'ten sonra Anadolu açıldı. Süleyman Şah akıncıları batıya, peri bacalarının arasından geçiriyor.',
            'Bizans sınır boylarını Akrit süvarileri tutuyor. Hızlı gelirler, okla erken karşıla.',
            'Kapadokya\'nın vadileri dar ve kıvrımlı. Kapılarda acele etme, doğru tarafı seç.'] },
  { ad: 'Konya Ovası', alt: 'Bozkırın kalbi',
    names: ['Ereğli Pınarı', 'Karapınar Kumları', 'Çumra Tarlaları', 'Çatalhöyük', 'Konya Önleri', 'Meram Bağları', 'Sille Vadisi', 'Kadınhanı', 'Ilgın Kaplıcası', 'Akşehir Gölü'],
    bosses: ['sinirdukasi', 'strategos'],
    lines: ['Bozkırda Bizans kervanları dolaşıyor. Kervanı okla durdur, ganimet akçe olarak hazineye gelsin.',
            'Ova geniş, rüzgâr serin. Konya yakında Türk yurdu olacak.',
            'Sınır Dukası ovaya asker yığmış. Önce okçuları sustur, sonra dal.'] },
  { ad: 'Frigya Yaylası', alt: 'Afyon\'dan kuzeye',
    names: ['Bolvadin Köprüsü', 'Afyon Kayası', 'İhsaniye Yaylası', 'Frig Vadisi', 'Midas Anıtı', 'Seyitgazi', 'Kütahya Yolu', 'Tavşanlı Geçidi', 'Domaniç Ormanı', 'İnegöl Ovası'],
    bosses: ['akritbeyi', 'katafraktbasi'],
    lines: ['Eski Frig kayaları sessiz tanık. Akıncılar yaylayı tozla dumana katıyor.',
            'Katafraktlar yaylaya çıktı. Ateşli Ok bulursan sakın bırakma.',
            'Kuzeye, denize doğru. Her kapı orduna yeni bir yiğit katabilir.'] },
  { ad: 'Bitinya Ormanları', alt: 'Sakarya\'yı geçerken',
    names: ['Bilecik Sırtları', 'Söğüt Yaylası', 'Osmaneli Köprüsü', 'Sakarya Kıyısı', 'Geyve Boğazı', 'Pamukova', 'Mekece Geçidi', 'Yenişehir Ovası', 'Orhangazi Yolu', 'Gemlik Körfezi'],
    bosses: ['sinirdukasi', 'varangbasi'],
    lines: ['Sakarya\'nın kıyısı ormanlık. Pusuya dikkat, Varanglar ağaçların arasında.',
            'Bir gün bu topraklardan büyük bir devlet doğacak. Bugün yolu akıncılar açıyor.',
            'Gemlik\'ten deniz kokusu geliyor. İznik çok yakın.'] },
  { ad: 'İznik', alt: '1075 · Süleyman Şah\'ın başkenti',
    names: ['İznik Gölü', 'Lefke Kapısı', 'Yenişehir Kapısı', 'Göl Kapısı', 'İstanbul Kapısı', 'Surlar Önü', 'Kule Baskını', 'Su Kemerleri', 'Saray Yolu', 'Başkent İznik'],
    bosses: ['katafraktbasi', 'iznikdukasi'],
    lines: ['İznik\'in surları gölün kıyısında yükseliyor. Kapılar birer birer açılacak.',
            'Süleyman Şah İznik\'i başkent yapmak istiyor. Akıncılar öncü.',
            'Surların üstünde Bizans okçuları. Önce sen vur, sonra yaklaş.'] },
  /* ---- 3. sefer: Haçlılara Karşı ---- */
  { ad: 'Marmara Kıyısı', alt: '1096 · Haçlılar geliyor',
    names: ['Kibotos Kıyısı', 'Civetot Ordugâhı', 'Drakon Deresi', 'Halkalı Yokuş', 'Hersek Burnu', 'Karamürsel Yolu', 'Haçlı Öncüleri', 'İznik Ovası', 'Surlara Dönüş', 'Gece Çıkışı'],
    bosses: ['sovalyebasi', 'frankkontu'],
    lines: ['Avrupa\'dan Haçlı orduları geldi. Sultan Kılıç Arslan akıncılarını sahile gönderdi.',
            'Haçlı piyadeleri kalabalık ama dağınık. Kapılardan büyük çık, sonra okla karşıla.',
            'Arbaletçilerin okları sert. Menzile girmeden önce sayılarını erit.'] },
  { ad: 'Sakarya Vadisi', alt: 'Kılıç Arslan geri çekiliyor',
    names: ['Lefke Boğazı', 'Vezirhan', 'Sakarya Ormanı', 'Bozüyük Yolu', 'Karaköy Sırtı', 'Sarıcakaya', 'Gölpazarı', 'Pazaryeri', 'Kovalıca Tepesi', 'Çukurhisar'],
    bosses: ['sovalyebasi', 'katafraktbasi'],
    lines: ['Haçlılar mancınık kurdu. Yolda gölgesi düşen yere taş iner: o halkadan uzak dur.',
            'Geri çekil, düşmanı vadiye çek. Sonra tepelerden ok yağdır.',
            'Şövalyeler demir zırhlı. Yaklaşmadan önce en güçlü yayını bul.'] },
  { ad: 'Dorylaion', alt: '1 Temmuz 1097',
    names: ['Eskişehir Ovası', 'Porsuk Kıyısı', 'Bozdağ Sırtları', 'Sabah Baskını', 'Haçlı Ordugâhı', 'Atlı Okçular', 'Bataklık Kenarı', 'Öğle Sıcağı', 'İkinci Haçlı Kolu', 'Dorylaion Meydanı'],
    bosses: ['frankkontu', 'normandukasi'],
    lines: ['Şafak vakti Türk atlı okçuları Haçlı ordugâhını sardı. Yay çek, dağılma.',
            'Haçlı ordusu ikiye bölünmüş. Önündekini dağıt, ikinci kol gelmeden.',
            'Temmuz sıcağı zırhlıları yoruyor. Hızlı ol, Akıncı Bey.'] },
  { ad: 'Orta Anadolu', alt: 'Susuz yollar',
    names: ['Akşehir Yaylası', 'Philomelion', 'Sultandağı Eteği', 'Ilgın Yolu', 'Kuyular Kurudu', 'Konya Surları', 'Karaman Ovası', 'Toros Yolu', 'Kızılırmak Geçidi', 'Merzifon Düzlüğü'],
    bosses: ['sovalyebasi', 'frankkontu'],
    lines: ['Sultan kuyuları kurutup Haçlıları susuz bıraktı. Yollar uzun, zırhlar ağır.',
            'Mancınık taşları yine yağıyor. Halkanın gölgesine dikkat.',
            'Toros\'a doğru çekilen Haçlıları kovala. Yolu kapat.'] },
  { ad: 'Ereğli', alt: '1101 · Son Haçlı dalgası',
    names: ['Ereğli Pınarları', 'Merzifon Ovası', 'Lombard Kolu', 'Nevers Kolu', 'Akarsu Başı', 'Pusu Vadisi', 'Kuru Dere', 'Toros Kapısı', 'Sancak Tepesi', 'Ereğli Zaferi'],
    bosses: ['normandukasi', 'haclibasi'],
    lines: ['1101 yazı: üç Haçlı ordusu birbiri ardına Anadolu\'ya girdi. Hepsini karşıla.',
            'Kılıç Arslan ve Danişmend Gazi omuz omuza. Akıncılar öncü.',
            'Ereğli pınarlarında son hesaplaşma. Haçlı sancağını düşür.'] },
  /* ---- 4. sefer: Miryokefalon ---- */
  { ad: 'Konya Savunması', alt: '1176 · Bizans geri döndü',
    names: ['Konya Kalesi', 'Alaeddin Tepesi', 'Meram Çayı', 'Kızılören Hanı', 'Beyşehir Yolu', 'Seydişehir', 'Kubadabad', 'Bozkır Yaylası', 'Suğla Gölü', 'Akkaya'],
    bosses: ['kalkanbasi', 'strategos'],
    lines: ['İmparator Manuel büyük bir orduyla Konya\'ya yürüyor. Sultan II. Kılıç Arslan akıncılarını çağırdı.',
            'Kalkanlı ağır piyadeler yavaş ama sağlam. Okun gücü yetmezse yanlarından dolaş.',
            'Konya Selçuklu\'nun başkenti. Bir adım geri yok.'] },
  { ad: 'Göller Bölgesi', alt: 'Eğirdir\'den Burdur\'a',
    names: ['Eğirdir Gölü', 'Can Ada', 'Yalvaç Harabeleri', 'Gelendost', 'Barla Dağı', 'Isparta Bağları', 'Ağlasun', 'Sagalassos Yolu', 'Burdur Gölü', 'Keçiborlu'],
    bosses: ['mancinikustasi', 'katafraktbasi'],
    lines: ['Göllerin arasından Bizans ağırlıkları ilerliyor. Kuşatma makineleri de yanlarında.',
            'Mancınık Ustası taş yağdırıyor. Gölgeler düşmeden yolunu değiştir.',
            'Gölün suyu berrak, ordunun yolu çetin.'] },
  { ad: 'Sultan Dağları', alt: 'Dağ yolları',
    names: ['Sultandağı Zirvesi', 'Çay Ovası', 'Bolvadin Gölü', 'Şuhut Yaylası', 'Dinar Pınarı', 'Çivril Ovası', 'Homa Geçidi', 'Menderes Kaynağı', 'Işıklı Gölü', 'Dağlar Arası'],
    bosses: ['kalkanbasi', 'varangbasi'],
    lines: ['Dağ yolları daralıyor. Dar geçitte kalabalık ordu sıkışır, bir kısmı geride kalır.',
            'Bizans ordusu dağlara girdi. Pusu kurmanın tam zamanı.',
            'Menderes\'in kaynağından batıya. Varanglar yine imparatorun yanında.'] },
  { ad: 'Tzivritze Geçidi', alt: 'Pusu hazırlanıyor',
    names: ['Geçit Ağzı', 'Kartal Kayalıkları', 'Dar Boğaz', 'Toz Bulutu', 'Bizans Kervanı', 'Ağırlık Arabaları', 'Yamaçtaki Okçular', 'Kayalar Yuvarlanıyor', 'Dağ Rüzgârı', 'Pusu Kapanıyor'],
    bosses: ['mancinikustasi', 'kalkanbasi'],
    lines: ['Bizans ordusu kilometrelerce uzayan bir kol halinde geçide girdi. Akıncılar tepelerde bekliyor.',
            'Geçit dar: ordunu büyütürken boğaza dikkat et.',
            'Ağırlık arabaları ganimet dolu. Kervanları durdur, hazine dolsun.'] },
  { ad: 'Miryokefalon', alt: '17 Eylül 1176',
    names: ['Miryokefalon Kalesi', 'İmparator Çadırı', 'Kuşatma Kulesi', 'Ağır Piyade Hattı', 'Sancak Muhafızları', 'Son Hücum', 'Toz Duman', 'Barış Elçileri', 'Bizans Dağılıyor', 'Anadolu Türk Yurdu'],
    bosses: ['varangbasi', 'manuel'],
    lines: ['Pusu kapandı. Bizans ordusu geçitte sıkıştı, akıncılar dört bir yandan iniyor.',
            'İmparatorun sancağı tepede. Muhafızlarını dağıt.',
            'Bu zaferden sonra Anadolu bir daha geri alınamayacak.'] },
  /* ---- 5. sefer: Selçuklu'nun Zirvesi ---- */
  { ad: 'Antalya', alt: '1207 · Akdeniz\'e iniş',
    names: ['Isparta Geçidi', 'Bucak Yaylası', 'Döşemealtı', 'Düden Şelalesi', 'Antalya Surları', 'Kaleiçi', 'Hadrian Kapısı', 'Konyaaltı Kıyısı', 'Liman Kulesi', 'Antalya Fethi'],
    bosses: ['latinkomutani', 'kalkanbasi'],
    lines: ['Sultan Keyhüsrev Akdeniz\'e iniyor. Antalya\'yı tutan Latin paralı askerleri surların önünde.',
            'Toroslar\'dan sahile yol uzun. Ordunu yolda büyüt, surlara güçlü var.',
            'Limanı tutan kule düşerse Akdeniz\'in kapısı açılır.'] },
  { ad: 'Sinop', alt: '1214 · Karadeniz\'e açılış',
    names: ['Kastamonu Yolu', 'Ilgaz Dağları', 'Boyabat Kalesi', 'Gerze Kıyısı', 'Sinop Burnu', 'Sinop Surları', 'İskele Kulesi', 'Hamsilos Koyu', 'Tersane Önü', 'Sinop Fethi'],
    bosses: ['trabzondukasi', 'strategos'],
    lines: ['Karadeniz\'in en güvenli limanı Sinop. Trabzon Dukası\'nın askerleri yolu kesti.',
            'Ilgaz\'ın ormanları serin, yollar dar. Mancınıklara dikkat.',
            'Denize iki taraftan açılan sultanlık doğuyor.'] },
  { ad: 'Alanya', alt: '1221 · Alaiye',
    names: ['Manavgat Şelalesi', 'Side Harabeleri', 'Kalonoros Yolu', 'Alara Çayı', 'Kızıl Kule', 'Alanya Kalesi', 'Tersane', 'Damlataş', 'İç Kale', 'Alaiye'],
    bosses: ['latinkomutani', 'katafraktbasi'],
    lines: ['Sultan Alaeddin Keykubad sarp kayalıktaki kaleyi istiyor. Kalonoros\'un kapıları sıkı.',
            'Kıyı yolu dar; kalabalık ordu kayalıklarda sıkışabilir.',
            'Kızıl Kule\'yi tutan Latin askerleri inatçı. Ok yağmurunu kesme.'] },
  { ad: 'Kervan Yolları', alt: 'Sultanhanı\'ndan Kayseri\'ye',
    names: ['Sultanhanı', 'Aksaray Yolu', 'Ağzıkarahan', 'Zazadin Hanı', 'Obruk Hanı', 'Kızılırmak Köprüsü', 'Sarıhan', 'Kayseri Yolu', 'Karatay Hanı', 'Kervan Kafilesi'],
    bosses: ['akritbeyi', 'kalkanbasi'],
    lines: ['Kervansaraylar yolları güvenli kılıyor. Haydutlaşan sınır atlıları kervanları vuruyor.',
            'Yol boyu ganimet kervanları var. Okla durdur, hazine dolsun.',
            'Selçuklu\'nun kervan yolu dünyanın ticaretini taşıyor. Yolu açık tut.'] },
  { ad: 'Suğdak', alt: '1225 · Kırım seferi',
    names: ['Sinop İskelesi', 'Karadeniz Geçişi', 'Suğdak Limanı', 'Kırım Kıyısı', 'Kıpçak Bozkırı', 'Rus Öncüleri', 'Suğdak Kalesi', 'Ceneviz Kulesi', 'Kale Kapısı', 'Suğdak Zaferi'],
    bosses: ['rusknezi', 'cenevizkaptani'],
    lines: ['Akıncılar gemilerle Karadeniz\'i aşıp Kırım\'a çıktı. Kıyıda Rus ve Kıpçak atlıları bekliyor.',
            'Bozkır geniş, atlılar hızlı. Okla erken karşıla.',
            'Suğdak limanı alınırsa Karadeniz ticareti Selçuklu\'nun olur.'] },
  /* ---- 6. sefer: Uç Beylikleri ---- */
  { ad: 'Söğüt', alt: 'Ertuğrul Gazi\'nin yurdu',
    names: ['Söğüt Yaylası', 'Domaniç Kışlağı', 'Ertuğrul Obası', 'Karacahisar Yolu', 'Karacahisar', 'Bilecik Pazarı', 'İnegöl Yolu', 'Kulaca Hisar', 'Eskişehir Ovası', 'Uç Sancağı'],
    bosses: ['tekfur', 'kumandan'],
    lines: ['Söğüt\'te küçük bir oba büyüyor. Uç boyunda tekfurların askerleri yolu kesiyor.',
            'Yaylada kışlak, ovada pazar. Akıncılar her gün biraz daha batıya.',
            'Tekfurun hisarı tepede. Önce okçularını sustur.'] },
  { ad: 'Sakarya Boyları', alt: 'Uçtan batıya',
    names: ['Sakarya Geçidi', 'Lefke Hisarı', 'Osmaneli', 'Geyve Boğazı', 'Akhisar', 'Karatekin', 'Taraklı', 'Göynük', 'Mudurnu Yolu', 'Sakarya Kıyısı'],
    bosses: ['tekfur', 'strategos'],
    lines: ['Sakarya\'nın kıyısındaki hisarlar birer birer düşüyor.',
            'Boğazlar dar, dağ yolları sarp. Geçitte sıkışma.',
            'Bizans sınır muhafızları geri çekiliyor. Peşlerini bırakma.'] },
  { ad: 'Bursa Ovası', alt: 'Uludağ\'ın eteği',
    names: ['Yenişehir', 'Yarhisar', 'Bilecik Hisarı', 'İnegöl', 'Ulubat Gölü', 'Uludağ Eteği', 'Kestel', 'Kaplıcalar', 'Bursa Önleri', 'Çekirge'],
    bosses: ['tekfur', 'katafraktbasi'],
    lines: ['Bursa ovası yemyeşil. Tekfurlar şehri kuşatmadan korumak istiyor.',
            'Uludağ\'dan inen sular soğuk, akıncının yüreği sıcak.',
            'Bursa\'yı saran hisarlar düşerse şehir yalnız kalır.'] },
  { ad: 'İznik Yolu', alt: 'Marmara kıyıları',
    names: ['Köprühisar', 'İznik Gölü', 'Yalakova', 'Karamürsel', 'Hersek', 'Dil İskelesi', 'Yalova Kıyısı', 'Armutlu', 'Gemlik', 'Sapanca Gölü'],
    bosses: ['alanbeyi', 'kalkanbasi'],
    lines: ['İmparator Alan süvarilerini paralı tuttu. Hızlı ve sert gelirler.',
            'Marmara\'nın kıyısında Bizans\'ın son kaleleri.',
            'Göl kıyısında pusu kur, düşmanı içeri çek.'] },
  { ad: 'Koyunhisar', alt: '27 Temmuz 1302',
    names: ['İzmit Yolu', 'Bafeus Ovası', 'Koyunhisar', 'Sabah Pususu', 'Bizans Alayı', 'Alan Kanadı', 'Ağır Piyade Hattı', 'Son Hücum', 'Ovada Zafer', 'Osman Gazi\'nin Sancağı'],
    bosses: ['alanbeyi', 'bizansbaskomutani'],
    lines: ['Bizans büyük bir ordu gönderdi. Osman Gazi\'nin akıncıları Koyunhisar\'da karşılıyor.',
            'Ova geniş, düşman kalabalık. Kapılardan büyük çık.',
            'Bu zafer küçük beyliği devlete dönüştürecek.'] },
  /* ---- 7. sefer: Rumeli'ye Geçiş ---- */
  { ad: 'Bursa', alt: '1326 · Yeni başkent',
    names: ['Bursa Kuşatması', 'Balabancık Kulesi', 'Hisar Kapısı', 'Pınarbaşı', 'Kaplıca Kapısı', 'Bursa Teslim', 'Çarşı Yolu', 'Yeni Başkent', 'Tophane Sırtı', 'Bursa Zaferi'],
    bosses: ['tekfur', 'kalkanbasi'],
    lines: ['Yıllar süren kuşatma bitmek üzere. Orhan Gazi Bursa\'nın kapılarında.',
            'Hendekler kazılmış. Köprüyü bul, ordunu karşıya geçir.',
            'Bursa düşerse beylik bir başkente kavuşur.'] },
  { ad: 'Pelekanon', alt: '1329 · İmparatora karşı',
    names: ['Eskihisar', 'Darıca', 'Pelekanon', 'Maltepe Sırtları', 'Kartal Kıyısı', 'Gece Baskını', 'İmparator Çekiliyor', 'Gebze Yolu', 'Dil Burnu', 'Pelekanon Zaferi'],
    bosses: ['katalanbasi', 'varangbasi'],
    lines: ['İmparator ordusuyla İznik\'i kurtarmaya geliyor. Katalan paralı askerleri de yanında.',
            'Sırtlardan ok yağdır, ovada çarpışmaya girme.',
            'Gece baskınında Bizans ordusu dağılıyor. Peşlerini bırakma.'] },
  { ad: 'İznik ve İzmit', alt: '1331–1337',
    names: ['İznik Surları', 'Göl Kapısı', 'İznik Teslim', 'İzmit Körfezi', 'Hereke', 'Karamürsel Tersanesi', 'İzmit Kalesi', 'Kocaeli', 'Kandıra', 'Kocaeli Sancağı'],
    bosses: ['tekfur', 'strategos'],
    lines: ['İznik yeniden Türk şehri oluyor. Sırada İzmit var.',
            'Karamürsel\'de ilk tersane kuruluyor. Kıyıyı tut.',
            'Hendekli yollar zorlu. Köprüyü kaçırma.'] },
  { ad: 'Gelibolu', alt: '1354 · Rumeli yakası',
    names: ['Çanakkale Boğazı', 'Sallar Üstünde', 'Çimpe Kalesi', 'Bolayır', 'Gelibolu Yarımadası', 'Deprem Gecesi', 'Gelibolu Surları', 'Rumeli Yakası', 'Tekirdağ Yolu', 'Gelibolu Fethi'],
    bosses: ['katalanbasi', 'kalkanbasi'],
    lines: ['Süleyman Paşa akıncıları sallarla boğazı geçirdi. Çimpe Kalesi ilk durak.',
            'Deprem surları yıktı; Gelibolu\'nun kapısı açık.',
            'Rumeli yakasında ilk adım. Geri dönüş yok.'] },
  { ad: 'Edirne', alt: '1361 · Rumeli\'nin kalbi',
    names: ['Malkara', 'Keşan', 'Sazlıdere', 'İpsala', 'Meriç Kıyısı', 'Dimetoka', 'Edirne Ovası', 'Tunca Köprüsü', 'Edirne Surları', 'Edirne Fethi'],
    bosses: ['tekfur', 'edirnekomutani'],
    lines: ['Trakya ovası açıldı. Edirne\'nin tekfuru kaleyi bırakmak istemiyor.',
            'Meriç\'in kıyısında Bizans\'ın son alayları.',
            'Edirne alınırsa Rumeli\'nin kalbi bizim olur.'] },
  /* ---- 8. sefer: Kosova ---- */
  { ad: 'Trakya', alt: '1364 · Sırp Sındığı',
    names: ['Filibe Yolu', 'Meriç Vadisi', 'Çirmen', 'Sırp Sındığı', 'Hasköy', 'Eski Zağra', 'Yeni Zağra', 'Balkan Eteği', 'Kızanlık', 'Trakya Sancağı'],
    bosses: ['sirpvoyvoda', 'kumandan'],
    lines: ['Balkan ittifakı Edirne\'ye yürüyor. Akıncılar gece baskınına hazır.',
            'Sırp piyadeleri kalabalık. Kapılardan büyük çık.',
            'Meriç\'in sisi ordunu gizlesin, okun düşmanı bulsun.'] },
  { ad: 'Balkan Dağları', alt: 'Sofya\'ya',
    names: ['Şıpka Geçidi', 'Tırnova Yolu', 'Balkan Ormanı', 'Karlova', 'Sofya Ovası', 'Vitoşa Eteği', 'Sofya Kalesi', 'Şehirköy', 'Niş Yolu', 'Niş Kalesi'],
    bosses: ['bulgarboyari', 'kalkanbasi'],
    lines: ['Balkan dağlarının geçitleri dar. Kalabalık ordu sıkışır.',
            'Bulgar boyarları kalelerini tutuyor. Okla aç yolunu.',
            'Sofya ovası açılırsa Sırp toprakları yakın.'] },
  { ad: 'Makedonya', alt: 'Vardar\'dan Ohri\'ye',
    names: ['Ustrumca', 'Vardar Vadisi', 'Köprülü', 'Üsküp', 'Kalkandelen', 'Manastır', 'Pirlepe', 'Ohri Gölü', 'İştip', 'Makedonya Sancağı'],
    bosses: ['sirpvoyvoda', 'katafraktbasi'],
    lines: ['Vardar vadisi boyunca kaleler. Sırp voyvodaları direniyor.',
            'Ohri Gölü\'nün kıyısı serin, yollar uzun.',
            'Hendek kazılmış yollar var. Köprüyü kaçırma.'] },
  { ad: 'Sırp Toprakları', alt: 'Morava boyunca',
    names: ['İbar Vadisi', 'Kruşevaç Yolu', 'Morava Kıyısı', 'Toplica', 'Prokuplye', 'Kurşumlu', 'Sırp Ordugâhı', 'Lab Deresi', 'Sitnica Kıyısı', 'Kosova Yolu'],
    bosses: ['bulgarboyari', 'sirpvoyvoda'],
    lines: ['Sırp ağır süvarileri ovada. Demir zırhlı atlılara en güçlü yayınla karşı dur.',
            'Morava\'nın kıyısında Balkan ordusu toplanıyor.',
            'Kosova\'ya giden yol açılıyor.'] },
  { ad: 'Kosova Ovası', alt: '15 Haziran 1389',
    names: ['Kosova Ovası', 'Sabah Saflaşması', 'Okçular Hattı', 'Ağır Süvari Hücumu', 'Sol Kanat', 'Sağ Kanat', 'Yıldırım Hücumu', 'Merkez Çöküyor', 'Kral Sancağı', 'Kosova Zaferi'],
    bosses: ['agirsuvaribasi', 'sirpkralsancagi'],
    lines: ['Kosova ovasında Balkan ittifakı saf tuttu. Sultan Murad akıncıları öne sürdü.',
            'Ağır süvari hücumunu okla durdur, sonra kanatlardan kapan.',
            'Bu ovada Balkanlar\'ın kaderi yazılacak.'] },
  /* ---- 9. sefer: Niğbolu ---- */
  { ad: 'Tuna Boyu', alt: 'Vidin\'den Silistre\'ye',
    names: ['Vidin Yolu', 'Tuna Kıyısı', 'Rahova', 'Lom Kalesi', 'Tuna Adaları', 'Silistre', 'Ziştovi', 'Tırnova', 'Tuna Gemileri', 'Tuna Sancağı'],
    bosses: ['eflakbeyi', 'kalkanbasi'],
    lines: ['Yıldırım Bayezid Tuna\'yı sınır yapıyor. Kıyı kaleleri birer birer alınmalı.',
            'Tuna geniş ve hızlı. Kıyı yolunda pusulara dikkat.',
            'Eflak beyinin atlıları nehrin öbür yakasından geliyor.'] },
  { ad: 'Eflak', alt: '1395 · Argeş kıyısı',
    names: ['Karaova', 'Argeş Kıyısı', 'Eflak Ormanı', 'Rovine Bataklığı', 'Craiova', 'Olt Nehri', 'Eflak Ordugâhı', 'Turnu', 'Yerköy', 'Eflak Dönüşü'],
    bosses: ['eflakbeyi', 'macarbaronu'],
    lines: ['Eflak ormanları sık, bataklıklar derin. Dar geçitte ordun sıkışmasın.',
            'Macar baronları Eflak beyine yardıma geldi.',
            'Rovine\'de çamur dizlere kadar. Hızlı ol, Akıncı Bey.'] },
  { ad: 'Haçlı Ordusu', alt: '1396 · Avrupa ayakta',
    names: ['Budin Haberi', 'Demirkapı', 'Orsova', 'Haçlı Öncüleri', 'Vidin Kuşatması', 'Rahova Baskını', 'Fransız Şövalyeleri', 'Macar Atlıları', 'Kazıklı Hat', 'Niğbolu Önleri'],
    bosses: ['sovalyebasi', 'macarbaronu'],
    lines: ['Avrupa\'nın dört bir yanından şövalyeler Tuna\'ya indi. Kalabalıklar, gururlular.',
            'Fransız şövalyeleri hücuma acele ediyor. Bırak gelsinler, okla karşıla.',
            'Kazıklı hattı aşamayan şövalye attan iner.'] },
  { ad: 'Niğbolu Kuşatması', alt: 'Kale direniyor',
    names: ['Niğbolu Kalesi', 'Tuna Kapısı', 'Kuşatma Kuleleri', 'Hendek Başı', 'Sur Dibi', 'Kale Muhafızları', 'Yıldırım Yetişiyor', 'Gece Yürüyüşü', 'Tepe Ordugâhı', 'Sabah Sisi'],
    bosses: ['frankkontu', 'fransizkontu'],
    lines: ['Niğbolu Kalesi\'nin muhafızları teslim olmuyor. Haçlılar kuşatma kuleleri kurdu.',
            'Yıldırım Bayezid yıldırım gibi yetişiyor. Kuşatmayı yar.',
            'Hendekler kazılmış. Köprüyü bul.'] },
  { ad: 'Niğbolu Meydanı', alt: '25 Eylül 1396',
    names: ['Kazıklı Saflar', 'Akıncılar Öncü', 'Şövalye Hücumu', 'Yokuş Yukarı', 'Sipahiler Kapanıyor', 'Macar Merkezi', 'Haçlı Ricatı', 'Tuna Kıyısında', 'Haçlı Sancağı', 'Niğbolu Zaferi'],
    bosses: ['macarbaronu', 'haclikral'],
    lines: ['Şövalyeler yokuş yukarı hücum ediyor. Akıncılar önde, sipahiler tepede.',
            'Kazıklar şövalyeleri yavaşlatır. Ok yağmurunu kesme.',
            'Haçlı sancağı düşerse Avrupa\'nın büyük ordusu dağılır.'] },
  /* ---- 10. sefer: Varna ---- */
  { ad: 'İzladi', alt: '1443 · Kış seferi',
    names: ['Sofya Yolu', 'Zlatitsa Geçidi', 'Karlı Dağ', 'İzladi Derbendi', 'Dağda Kış', 'Kuşatılmış Geçit', 'Kunoviça', 'Sisli Vadi', 'Filibe Yolu', 'Edirne Savunması'],
    bosses: ['erdelvoyvoda', 'sovalyebasi'],
    lines: ['Haçlı ordusu kışın Balkan geçitlerine dayandı. Derbendi tut.',
            'Kar dizlere kadar, geçit dar. Kalabalık ordu sıkışır.',
            'Erdel Voyvodası\'nın atlıları geçidi zorluyor.'] },
  { ad: 'Barış Bozuluyor', alt: '1444 · Haçlı yeniden yolda',
    names: ['Edirne Sarayı', 'Elçiler', 'Tuna Kenarı', 'Ahitname', 'Haçlı Ordusu Yolda', 'Vidin Geçidi', 'Niğbolu Yanıyor', 'Şumnu', 'Provadiya', 'Haçlı Ordugâhı'],
    bosses: ['macarbaronu', 'lehsovalye'],
    lines: ['Barış yemini bozuldu. Haçlı ordusu Tuna\'yı geçip Karadeniz\'e iniyor.',
            'Araba tabyaları ve tüfekçiler ilk kez sahada. Barut kokusu var.',
            'Kaleleri yakarak ilerliyorlar. Önlerini kes.'] },
  { ad: 'Boğazlar', alt: 'Sultan geçiyor',
    names: ['Gelibolu Boğazı', 'Venedik Donanması', 'Anadolu Hisarı', 'Ceneviz Gemileri', 'Boğaz Geçişi', 'Rumeli Kıyısı', 'Hayrabolu', 'Kırklareli', 'Aydos', 'Karnobat'],
    bosses: ['venedikkaptani', 'kalkanbasi'],
    lines: ['Venedik donanması boğazı kapattı. Sultan Murad ordusunu Boğaziçi\'nden geçiriyor.',
            'Ceneviz gemileri yardım ediyor. Kıyıya çık, hızlı yürü.',
            'Ordu Rumeli yakasında. Varna\'ya zorlu yürüyüş başlıyor.'] },
  { ad: 'Karadeniz Kıyısı', alt: 'Varna\'ya',
    names: ['Burgaz', 'Süzebolu', 'Aydos Geçidi', 'Emine Burnu', 'Galata Burnu', 'Varna Gölü', 'Franga Platosu', 'Araba Tabyası', 'Macar Atlıları', 'Varna Önleri'],
    bosses: ['erdelvoyvoda', 'tabyakomutani'],
    lines: ['Haçlılar Varna\'da araba tabyası kurdu. Arabaların ardından tüfekler patlıyor.',
            'Tabyayı okla kır ya da yanından dolaş.',
            'Göl ile deniz arasında dar bir ova. Savaş burada olacak.'] },
  { ad: 'Varna', alt: '10 Kasım 1444',
    names: ['Sabah Saflaşması', 'Sağ Kanat', 'Sol Kanat', 'Yeniçeri Hattı', 'Kral Hücumu', 'Kalkan Duvarı', 'Araba Kalesi', 'Haçlı Ricatı', 'Haçlı Sancağı', 'Varna Zaferi'],
    bosses: ['lehsovalye', 'haclikral'],
    lines: ['Haçlı kralı ağır süvarisiyle merkeze hücum ediyor. Yeniçeriler sabit, akıncılar kanatlarda.',
            'Kanatlar sallanıyor; sancağı yüksek tut.',
            'Bu zaferden sonra İstanbul\'un yolu açık.'] },
  /* ---- 11. sefer: İstanbul'un Fethi ---- */
  { ad: 'Boğazkesen', alt: '1452 · Rumeli Hisarı',
    names: ['Edirne Ordugâhı', 'Çorlu Yolu', 'Silivri Önleri', 'Boğaziçi Kıyısı', 'Hisarın Temeli', 'Sarıca Paşa Kulesi', 'Halil Paşa Kulesi', 'Zağanos Paşa Kulesi', 'Boğazkesen', 'Hisar Tamam'],
    bosses: ['tekfur', 'cenevizkaptani'],
    lines: ['Sultan II. Mehmed Boğaz\'ın en dar yerine bir hisar yaptırıyor. Akıncılar kıyıyı tutuyor.',
            'Dört ayda yükselecek bir hisar: işçileri koru, yolu açık tut.',
            'Ceneviz gemileri Boğaz\'dan geçmek istiyor. Kıyıdan ok yağdır.'] },
  { ad: 'Şahi Toplar', alt: 'Edirne\'den İstanbul\'a',
    names: ['Edirne Dökümhanesi', 'Top Arabaları', 'Çatalca Yolu', 'Büyükçekmece Köprüsü', 'Küçükçekmece', 'Ayastefanos', 'Ordugâh Kuruluyor', 'Lykos Sırtları', 'Top Mevzileri', 'İlk Atış'],
    bosses: ['kumandan', 'surkomutani'],
    lines: ['Dev toplar yüzlerce öküzle Edirne\'den yola çıktı. Önlerindeki yolu temizle.',
            'Şehrin önünde ordugâh kuruluyor. Bizans öncülerini surlara geri püskürt.',
            'İlk sur duvarları yolu kesiyor. Okla yık, yoksa çarparsın.'] },
  { ad: 'Kara Surları', alt: 'Nisan 1453',
    names: ['Altın Kapı', 'Yedikule', 'Silivri Kapısı', 'Mevlevihane Kapısı', 'Topkapı', 'Edirnekapı', 'Eğrikapı', 'Hendek Başı', 'Lykos Vadisi', 'İlk Gedik'],
    bosses: ['surkomutani', 'kalkanbasi'],
    lines: ['Üç kat sur, önünde derin hendek. Bin yıldır kimse aşamadı.',
            'Toplar gece gündüz surları dövüyor. Sen de oklarını konuştur.',
            'Ceneviz zırhlıları gediği tutuyor. Ağır ama yavaşlar.'] },
  { ad: 'Haliç', alt: 'Gemiler karadan yürüyor',
    names: ['Dolmabahçe Kıyısı', 'Kızaklar Yağlanıyor', 'Gemiler Tepede', 'Kasımpaşa Deresi', 'Haliç Kıyısı', 'Galata Önleri', 'Zincirin Ardı', 'Ayvansaray', 'Fener Kıyısı', 'Haliç Bizim'],
    bosses: ['cenevizkaptani', 'venedikkaptani'],
    lines: ['Haliç\'in ağzı zincirle kapalı. Sultan gemileri bir gecede tepelerin üstünden yürütüyor.',
            'Sabah Bizans uyandığında gemiler Haliç\'te. Kıyıyı tut.',
            'Venedik ve Ceneviz gemicileri surların arkasından ok atıyor.'] },
  { ad: 'Son Hücum', alt: '29 Mayıs 1453',
    names: ['Şafak Vakti', 'İlk Dalga', 'İkinci Dalga', 'Yeniçeri Hücumu', 'Ulubatlı Hasan', 'Burcun Üstünde', 'Kerkoporta', 'Surlar Aşıldı', 'Şehrin İçinde', 'Fetih'],
    bosses: ['cenevizkomutani', 'sonsancak'],
    lines: ['Elli üç günlük kuşatmanın son sabahı. Bütün ordu aynı anda hücuma kalkıyor.',
            'Ulubatlı Hasan sancağı burca dikti. Arkasından yetiş.',
            'Gedik açıldı. Bu kapıdan bir çağ geçecek.'] },
  /* ---- 12. sefer: Fatih'in Seferleri ---- */
  { ad: 'Semendire', alt: '1459 · Tuna kıyısı',
    names: ['Tuna Kıyısı', 'Morava Ağzı', 'Semendire Önleri', 'Despot Sarayı', 'Golubaç Yolu', 'Golubaç Kalesi', 'Kuçevo', 'Braniçevo', 'Kale Teslim', 'Semendire Fethi'],
    bosses: ['sirpvoyvoda', 'kalkanbasi'],
    lines: ['Tuna\'nın kıyısındaki Semendire, Sırp despotluğunun son kalesi.',
            'Sırp süvarileri yeniden sahada. Demir zırhlıları okla karşıla.',
            'Kale düşerse Tuna boyu bir uçtan bir uca bizim.'] },
  { ad: 'Mora', alt: '1460 · Despotluklar',
    names: ['Korint Berzahı', 'Altı Mil Suru', 'Korint Kalesi', 'Arkadya Yaylası', 'Tripoliçe Yolu', 'Mistra', 'Kalavrita', 'Patras', 'Anavarin Kıyısı', 'Mora Fethi'],
    bosses: ['moradespotu', 'venedikkomutani'],
    lines: ['Mora despotları birbirine düştü. Venedik kıyıdaki kaleleri tutuyor.',
            'Berzahı kesen surları aş, yarımadaya gir.',
            'Arkadya\'nın dağları sarp. Kalabalık ordu geçitte sıkışır.'] },
  { ad: 'Trabzon', alt: '1461 · Karadeniz\'in doğusu',
    names: ['Sinop Teslim', 'Koyulhisar', 'Zigana Geçidi', 'Gümüşhane Yolu', 'Maçka Vadisi', 'Değirmendere', 'Trabzon Surları', 'Kale Kapısı', 'Trabzon Limanı', 'Trabzon Fethi'],
    bosses: ['trabzondukasi', 'trabzonmuhafizi'],
    lines: ['Ordu Zigana\'nın sarp geçitlerinden Karadeniz\'e iniyor. Yağmur dinmiyor.',
            'Dağ yolları dar ve kaygan. Geçide hazırlıklı gir.',
            'Trabzon\'un surları denize kadar iniyor. Kapıyı zorla.'] },
  { ad: 'Bosna', alt: '1463 · Dağların ardında',
    names: ['Saraybosna Ovası', 'Bobovaç Kalesi', 'Vranduk', 'Travnik', 'Yayçe Yolu', 'Yayçe Kalesi', 'Kreşevo', 'Neretva Kıyısı', 'Dağ Hisarları', 'Bosna Fethi'],
    bosses: ['bosnakrali', 'macarbaronu'],
    lines: ['Bosna kralı dağ kalelerine çekildi. Macar baronları yardıma geliyor.',
            'Ormanlık vadilerde pusu var. Kapıları akıllı seç.',
            'Yayçe Kalesi kayalığın tepesinde. Önce okçularını sustur.'] },
  { ad: 'Eğriboz ve Otranto', alt: '1470–1480',
    names: ['Eğriboz Köprüsü', 'Eğriboz Surları', 'Venedik Kalesi', 'Ege Kıyısı', 'Avlonya Limanı', 'Adriyatik Geçişi', 'Otranto Kıyısı', 'Otranto Surları', 'Kale Burcu', 'Otranto Fethi'],
    bosses: ['venedikkomutani', 'otrantokomutani'],
    lines: ['Venedik\'in Ege\'deki en büyük kalesi Eğriboz. Gemilerden köprü kuruldu.',
            'Gedik Ahmed Paşa Avlonya\'dan denize açıldı. Sırada İtalya kıyısı var.',
            'Otranto\'nun surları yüksek. Okla yık, gediği aç.'] },
  /* ---- 13. sefer: Belgrad ve Rodos ---- */
  { ad: 'Sava Kıyısı', alt: '1521 · Belgrad yolu',
    names: ['Sofya Ordugâhı', 'Niş Konağı', 'Morava Köprüsü', 'Sava Kıyısı', 'Bögürdelen', 'Zemun', 'Kulpenik', 'Salankamen', 'Sava Geçişi', 'Belgrad Önleri'],
    bosses: ['hirvatbani', 'macarbaronu'],
    lines: ['Sultan Süleyman ilk seferine çıktı. Hedef, Tuna\'nın kilidi Belgrad.',
            'Hırvat piyadeleri sınır boyunu tutuyor. Kapılardan büyük çık.',
            'Arkebüzcülerin namluları uzaktan ateş açar. Menzile girmeden erit.'] },
  { ad: 'Belgrad', alt: 'Ağustos 1521',
    names: ['Belgrad Surları', 'Tuna Kulesi', 'Su Kapısı', 'Varoş', 'Kale Hendeği', 'Top Mevzileri', 'Nebojşa Kulesi', 'İç Kale', 'Kale Teslim', 'Belgrad Fethi'],
    bosses: ['belgradkomutani', 'zirhlibasi'],
    lines: ['Yetmiş yıldır alınamayan Belgrad\'ın önündeyiz. Surlar kat kat.',
            'Hendekleri köprüden geç, surları okla yık.',
            'Zırhlı Macar şövalyeleri kaleden çıkış yapıyor.'] },
  { ad: 'Ege Yolu', alt: '1522 · Donanma yolda',
    names: ['İstanbul Tersanesi', 'Gelibolu Limanı', 'Çanakkale', 'Midilli Açıkları', 'Sakız Kıyısı', 'Bodrum Önleri', 'Marmaris Ordugâhı', 'Kıyı Konağı', 'Karaya Çıkış', 'Rodos Kıyısı'],
    bosses: ['venedikkaptani', 'rodoskulesi'],
    lines: ['Donanma ve ordu Marmaris\'te buluştu. Karşıda Rodos görünüyor.',
            'Kıyıyı tutan şövalyeler gemileri durdurmak istiyor.',
            'Karaya çıktık. Şimdi surlara doğru.'] },
  { ad: 'Rodos Surları', alt: 'Kuşatma başlıyor',
    names: ['İngiliz Burcu', 'Aragon Burcu', 'İtalyan Burcu', 'Lağımcılar', 'Hendek Doluyor', 'Aziz Nikola Kulesi', 'Liman Kulesi', 'Burç Gediği', 'Kış Geliyor', 'Surlar Sarsılıyor'],
    bosses: ['rodoskulesi', 'kalkanbasi'],
    lines: ['Rodos\'un surları Akdeniz\'in en kalınları. Her burcu bir ayrı millet tutuyor.',
            'Lağımcılar surların altına iniyor. Sen yukarıdan ok yağdır.',
            'Rodos Şövalyeleri ağır zırhlı ve inatçı. Sabırlı ol.'] },
  { ad: 'Rodos', alt: 'Aralık 1522',
    names: ['Son Hücum', 'Kale İçi', 'Şövalyeler Sokağı', 'İç Liman', 'Üstadın Sarayı', 'Teslim Görüşmesi', 'Liman Kapısı', 'Şövalyeler Ayrılıyor', 'Sancak Burçta', 'Rodos Fethi'],
    bosses: ['rodoskulesi', 'rodosustadi'],
    lines: ['Altı aylık kuşatmanın sonu yaklaştı. Şövalyelerin üstadı son direnişte.',
            'Kış rüzgârı sert, ama ordu dimdik.',
            'Teslim olurlarsa canlarına dokunulmayacak. Önce son burcu al.'] },
  /* ---- 14. sefer: Mohaç ---- */
  { ad: 'Tuna Boyunca', alt: '1526 · Belgrad\'dan kuzeye',
    names: ['Belgrad Ordugâhı', 'Zemun Köprüsü', 'Salankamen', 'Tuna Gemileri', 'Varadin Yolu', 'Petervaradin', 'Varadin Kalesi', 'İlok', 'Vukovar', 'Srem Ovası'],
    bosses: ['hirvatbani', 'husarbasi'],
    lines: ['Sultan Süleyman ordusuyla Tuna boyunca kuzeye yürüyor. Önde akıncılar.',
            'Macar hafif süvarileri hızlı gelir. Okla erken karşıla.',
            'Petervaradin\'in surları yolu kesiyor. Gediği aç.'] },
  { ad: 'Drava Köprüsü', alt: 'Ösek',
    names: ['Ösek Ovası', 'Drava Kıyısı', 'Köprü Kuruluyor', 'Ösek Köprüsü', 'Karşıya Geçiş', 'Köprünün Ardı', 'Baranya', 'Darda', 'Bataklık Yolu', 'Mohaç Yolu'],
    bosses: ['zirhlibasi', 'macarbaronu'],
    lines: ['Drava\'nın üstüne beş günde köprü kuruldu. Ordu karşıya geçiyor.',
            'Köprüden geçmeyen hendekte kalır. Ordunu topla.',
            'Bataklık yolları dar. Kalabalık ordu sıkışabilir.'] },
  { ad: 'Macar Ordugâhı', alt: 'Kral ordusunu topluyor',
    names: ['Tolna', 'Paks Yolu', 'Kral Ordugâhı', 'Hırvat Alayları', 'Paralı Askerler', 'Macar Topları', 'Arabalar Diziliyor', 'Ova Kenarı', 'Gece Nöbeti', 'Sabah Saflaşması'],
    bosses: ['landsknechtbasi', 'topcubasi'],
    lines: ['Macar kralı ovada ordusunu topladı. Alman paralı askerleri de yanında.',
            'Macar topları ovaya bakıyor. Kırmızı şeritten çekil.',
            'Araba tabyaları yeniden kuruldu. Kır ya da dolaş.'] },
  { ad: 'Mohaç Ovası', alt: 'Öğle vakti',
    names: ['Bataklık Kenarı', 'Ovaya İniş', 'Sağ Kanat', 'Sol Kanat', 'Macar Hücumu', 'Geri Çekilir Gibi', 'Top Ateşi', 'Yeniçeri Hattı', 'Kanatlar Kapanıyor', 'Bataklığa Doğru'],
    bosses: ['husarbasi', 'zirhlibasi'],
    lines: ['Macar ağır süvarisi merkeze hücum ediyor. Akıncılar geri çekilir gibi yapıp kanatlara açılıyor.',
            'Malazgirt\'in hilal düzeni Mohaç\'ta yeniden kuruldu.',
            'Toplar ve tüfekler hücumu durdurdu. Şimdi kanatlardan kapan.'] },
  { ad: 'Mohaç', alt: '29 Ağustos 1526',
    names: ['Kral Muhafızları', 'Zırhlı Süvari', 'Son Hücum', 'Macar Merkezi', 'Paralılar Dağılıyor', 'Kral Kaçıyor', 'Ova Bizim', 'Budin Yolu', 'Budin Kapısı', 'Mohaç Zaferi'],
    bosses: ['zirhlibasi', 'macarkral'],
    lines: ['Savaş iki saat sürmedi. Macar ordusu dağılıyor.',
            'Kralın muhafızları sancağın etrafında son direnişte.',
            'Budin\'in yolu açık. Ama Tuna boyunda hesap henüz bitmedi.'] },
  /* ---- 15. sefer: Budin ---- */
  { ad: 'Viyana Yolu', alt: '1529 · Avusturya\'ya akın',
    names: ['Budin Önü', 'Tata', 'Yanıkkale', 'Györ Ovası', 'Moson', 'Avusturya Sınırı', 'Akıncılar İleride', 'Viyana Önleri', 'Kış Yaklaşıyor', 'Dönüş Yolu'],
    bosses: ['avusturyakomutani', 'landsknechtbasi'],
    lines: ['Akıncılar ordunun önünde Avusturya içlerine akın ediyor.',
            'Alman paralı askerleri uzun mızraklarıyla yolu kesiyor.',
            'Kış erken geldi. Ordu Budin\'e dönüyor; akıncılar artçıda.'] },
  { ad: 'Güns', alt: '1532 · Alman seferi',
    names: ['Esztergom Yolu', 'Güns Kalesi', 'Kale Burcu', 'Steyr Akını', 'Graz Yolu', 'Mura Kıyısı', 'Maribor', 'Drava Boyu', 'Dönüş Konağı', 'Sınır Boyu'],
    bosses: ['avusturyakomutani', 'husarbasi'],
    lines: ['Küçük Güns kalesi ordunun önünü kesti. Surları okla yık.',
            'Kasım Bey\'in akıncıları Tuna\'nın yukarılarına kadar uzanıyor.',
            'Dağ yollarından dönüş zorlu. Geçitlere dikkat.'] },
  { ad: 'Slavonya', alt: 'Sınır boyunda',
    names: ['Ösek Kalesi', 'Pojega', 'Velika', 'Drava Kıyısı', 'Kopriniça Yolu', 'Viroviçe', 'Hırvat Sınırı', 'Sava Boyu', 'Sınır Hisarları', 'Slavonya Sancağı'],
    bosses: ['hirvatbani', 'zirhlibasi'],
    lines: ['Drava ile Sava arasında hisarlar birer birer düşüyor.',
            'Hırvat banının askerleri ormanlarda pusu kuruyor.',
            'Hendekli yollar yine karşımızda. Köprüyü kaçırma.'] },
  { ad: 'Peşte', alt: '1541 · Tuna\'nın karşı kıyısı',
    names: ['Peşte Ovası', 'Avusturya Ordugâhı', 'Tuna Adası', 'Peşte Surları', 'Gece Baskını', 'Kuşatma Yarıldı', 'Avusturya Ricatı', 'Toplar Bırakıldı', 'Tuna Köprüsü', 'Peşte Önleri'],
    bosses: ['landsknechtbasi', 'topcubasi'],
    lines: ['Avusturya ordusu Budin\'i kuşattı. Sultan Süleyman yardıma yetişiyor.',
            'Gece baskınıyla kuşatma yarıldı. Kaçanların peşini bırakma.',
            'Avusturya topları ovada kaldı, ama son güllelerini atıyorlar.'] },
  { ad: 'Budin', alt: '29 Ağustos 1541',
    names: ['Budin Kalesi', 'Viyana Kapısı', 'Kale Yokuşu', 'Kral Sarayı', 'Gellért Tepesi', 'Tuna Kıyısı', 'Kaplıcalar', 'Kale Muhafızları', 'Sancak Kalede', 'Budin Eyaleti'],
    bosses: ['budinkomutani', 'avusturyakomutani'],
    lines: ['Mohaç\'ın yıl dönümü. Ordu Budin\'in kapısında.',
            'Kale yokuşu dik, surlar kalın. Gediği okla aç.',
            'Budin alınırsa Tuna boyu yüz elli yıl Türk sancağı taşıyacak.'] }
];
const BOSSES = {
  kumandan:      { ad: 'Öncü Kumandanı',     tip: 'piyade',    renk: 0xb8323a },
  duka:          { ad: 'Urfa Dukası',          tip: 'piyade',    renk: 0x8e1f5c },
  strategos:     { ad: 'Strategos',            tip: 'piyade',    renk: 0x6d2b8f },
  katafraktbasi: { ad: 'Katafrakt Başbuğu',    tip: 'katafrakt', renk: 0x5a6470 },
  varangbasi:    { ad: 'Varang Başı',          tip: 'varang',    renk: 0x3b4a5e },
  imparator:     { ad: 'İmparator Muhafızı',   tip: 'varang',    renk: 0x6a1b7a },
  akritbeyi:     { ad: 'Akrit Beyi',           tip: 'akrit',     renk: 0x9a4a2a },
  sinirdukasi:   { ad: 'Sınır Dukası',         tip: 'piyade',    renk: 0x7a2a6e },
  iznikdukasi:   { ad: 'İznik Dukası',         tip: 'varang',    renk: 0x5a2a8a },
  sovalyebasi:   { ad: 'Şövalye Başı',         tip: 'sovalye',   renk: 0x2c4f8f },
  frankkontu:    { ad: 'Frank Kontu',          tip: 'frank',     renk: 0x2a6a4a },
  normandukasi:  { ad: 'Norman Dükü',          tip: 'sovalye',   renk: 0x8a2a2a },
  haclibasi:     { ad: 'Haçlı Başkomutanı',    tip: 'sovalye',   renk: 0xd8d0c0 },
  kalkanbasi:    { ad: 'Kalkan Başı',          tip: 'kalkanli',  renk: 0x8e3a2a },
  mancinikustasi:{ ad: 'Mancınık Ustası',      tip: 'piyade',    renk: 0x6a5a3a },
  manuel:        { ad: 'İmparatorun Sancağı',  tip: 'varang',    renk: 0x7a1b6a },
  latinkomutani: { ad: 'Latin Komutanı',       tip: 'latin',     renk: 0x8a2a2a },
  trabzondukasi: { ad: 'Trabzon Dukası',       tip: 'piyade',    renk: 0x6a2a7a },
  rusknezi:      { ad: 'Rus Knezi',            tip: 'akrit',     renk: 0x5a4a2a },
  cenevizkaptani:{ ad: 'Ceneviz Kaptanı',      tip: 'arbalet',   renk: 0xb02a3a },
  tekfur:        { ad: 'Tekfur',               tip: 'piyade',    renk: 0x8e1f5c },
  alanbeyi:      { ad: 'Alan Beyi',            tip: 'alan',      renk: 0x4a5a3a },
  bizansbaskomutani: { ad: 'Bizans Başkumandanı', tip: 'varang', renk: 0x6a1b7a },
  katalanbasi:   { ad: 'Katalan Başı',         tip: 'katalan',   renk: 0xc8a02a },
  edirnekomutani:{ ad: 'Edirne Komutanı',      tip: 'kalkanli',  renk: 0x7a2a2a },
  sirpvoyvoda:   { ad: 'Sırp Voyvodası',       tip: 'sirpsovalye', renk: 0x9a2a2a },
  bulgarboyari:  { ad: 'Bulgar Boyarı',        tip: 'sirppiyade', renk: 0x2a6a4a },
  agirsuvaribasi:{ ad: 'Ağır Süvari Başı',     tip: 'sirpsovalye', renk: 0x5a5a6a },
  sirpkralsancagi:{ ad: 'Sırp Kralının Sancağı', tip: 'sirpsovalye', renk: 0xa02a2a },
  eflakbeyi:     { ad: 'Eflak Beyi',           tip: 'akrit',     renk: 0x3a4a8a },
  macarbaronu:   { ad: 'Macar Baronu',         tip: 'macar',     renk: 0x2a7a3a },
  fransizkontu:  { ad: 'Fransız Kontu',        tip: 'sovalye',   renk: 0x2a3a9a },
  haclikral:     { ad: 'Haçlı Kralı',          tip: 'sovalye',   renk: 0xd8b040 },
  erdelvoyvoda:  { ad: 'Erdel Voyvodası',      tip: 'macar',     renk: 0x8a2a2a },
  lehsovalye:    { ad: 'Leh Şövalyesi',        tip: 'sovalye',   renk: 0xb02030 },
  venedikkaptani:{ ad: 'Venedik Kaptanı',      tip: 'arbalet',   renk: 0xa0202a },
  tabyakomutani: { ad: 'Tabya Komutanı',       tip: 'tufekci',   renk: 0x4a3a2a },
  surkomutani:   { ad: 'Sur Komutanı',         tip: 'kalkanli',  renk: 0x7a1b2a },
  cenevizkomutani:{ ad: 'Ceneviz Komutanı',    tip: 'ceneviz',   renk: 0xb02a3a },
  sonsancak:     { ad: 'Son İmparatorun Sancağı', tip: 'varang', renk: 0x6a1b7a },
  moradespotu:   { ad: 'Mora Despotu',         tip: 'piyade',    renk: 0x6a2a7a },
  venedikkomutani:{ ad: 'Venedik Komutanı',    tip: 'venedik',   renk: 0xa0202a },
  trabzonmuhafizi:{ ad: 'Trabzon Muhafızı',    tip: 'varang',    renk: 0x5a2a8a },
  bosnakrali:    { ad: 'Bosna Kralı',          tip: 'sirpsovalye', renk: 0x2a4a9a },
  otrantokomutani:{ ad: 'Otranto Komutanı',    tip: 'ceneviz',   renk: 0x2a6a4a },
  hirvatbani:    { ad: 'Hırvat Banı',          tip: 'hirvat',    renk: 0xb02030 },
  belgradkomutani:{ ad: 'Belgrad Komutanı',    tip: 'hirvat',    renk: 0x2a7a3a },
  zirhlibasi:    { ad: 'Zırhlı Süvari Başı',   tip: 'zirhli',    renk: 0x5a5a6a },
  rodoskulesi:   { ad: 'Burç Muhafızı',        tip: 'rodos',     renk: 0x8a1a24 },
  rodosustadi:   { ad: 'Şövalyelerin Üstadı',  tip: 'rodos',     renk: 0x1a1a1a },
  husarbasi:     { ad: 'Hafif Süvari Başı',    tip: 'husar',     renk: 0x2a7a3a },
  landsknechtbasi:{ ad: 'Paralı Asker Yüzbaşısı', tip: 'landsknecht', renk: 0xd8b040 },
  topcubasi:     { ad: 'Topçu Başı',           tip: 'arkebuz',   renk: 0x3a3a40 },
  macarkral:     { ad: 'Macar Kralının Sancağı', tip: 'zirhli',  renk: 0xb02030 },
  avusturyakomutani:{ ad: 'Avusturya Kumandanı', tip: 'zirhli',  renk: 0xd8b040 },
  budinkomutani: { ad: 'Budin Kale Komutanı',  tip: 'landsknecht', renk: 0x1a1a1a }
};
const BOSS_TXT = {
  kumandan: 'Bölümün sonunda Öncü Kumandanı bekliyor. Dev gibi; ok yağmuruyla erit.',
  duka: 'Urfa Dukası kendi alayıyla yolu kesti. Kapılardan büyük çıkman gerek.',
  strategos: 'Bizans Strategos\'u ordusunun başında. Silahını güçlendirmeden yaklaşma.',
  katafraktbasi: 'Katafrakt Başbuğu demir zırhlı atıyla geliyor. Ateşli Ok bulursan çok işe yarar.',
  varangbasi: 'Varang Başı, imparatorun baltalı muhafızı. Çatışmaya girmeden önce yarısını düşür.',
  imparator: 'İmparator Romen Diyojen\'in Muhafız Alayı karşında. Bu son hamle, Akıncı Bey.',
  akritbeyi: 'Akrit Beyi sınır süvarileriyle yolu tuttu. Hızlı gelir; okun önünde erisin.',
  sinirdukasi: 'Sınır Dukası kalesinden çıktı. Alayını dağıtmadan ona ulaşamazsın.',
  iznikdukasi: 'İznik Dukası surların önünde son direnişte. Şehrin kapıları onun arkasında.',
  sovalyebasi: 'Şövalye Başı demir zırhlı atıyla hücuma kalktı. En güçlü yayını hazırla.',
  frankkontu: 'Frank Kontu piyadelerini sıraya dizdi. Önce kalabalığı erit.',
  normandukasi: 'Norman Dükü Haçlıların en çetin komutanı. Ok yağmurunu kesme.',
  haclibasi: 'Haçlı ordusunun başkomutanı sancağıyla karşında. Bu seferin son hamlesi.',
  kalkanbasi: 'Kalkan Başı ağır piyadenin önünde. Kalkanları delmek için güçlü yay gerek.',
  mancinikustasi: 'Mancınık Ustası taş yağdırıyor. Gölgelerden kaç, ustaya ok yağdır.',
  manuel: 'İmparator Manuel\'in sancağı ve muhafızları karşında. Miryokefalon\'un son hamlesi.',
  latinkomutani: 'Latin Komutanı paralı askerlerinin başında. Kalabalığı erit, sonra ona ulaş.',
  trabzondukasi: 'Trabzon Dukası Sinop\'u bırakmak istemiyor. Muhafızlarını dağıt.',
  rusknezi: 'Rus Knezi atlılarıyla kıyıya indi. Hızlı gelir, okla karşıla.',
  cenevizkaptani: 'Ceneviz Kaptanı kuleyi arbaletçileriyle tutuyor. Menzile girmeden erit.',
  tekfur: 'Hisarın Tekfuru kapıların önünde. Askerlerini dağıt, hisar senin.',
  alanbeyi: 'Alan Beyi paralı süvarilerinin başında. Hızlı ve sert gelir.',
  bizansbaskomutani: 'Bizans Başkumandanı ordusunun merkezinde. Koyunhisar\'ın son hamlesi.',
  katalanbasi: 'Katalan Başı, imparatorun paralı askerlerinin en çetini. Ok yağmurunu kesme.',
  edirnekomutani: 'Edirne Komutanı surların önünde son direnişte. Rumeli\'nin kalbi arkasında.',
  sirpvoyvoda: 'Sırp Voyvodası ağır süvarisiyle geliyor. En güçlü yayını hazırla.',
  bulgarboyari: 'Bulgar Boyarı kalesinin önünde. Piyadesini erit, kapı açılsın.',
  agirsuvaribasi: 'Ağır Süvari Başı hücuma kalktı. Yaklaşmadan önce sayılarını düşür.',
  sirpkralsancagi: 'Sırp Kralının Sancağı ve muhafızları karşında. Kosova\'nın son hamlesi.',
  eflakbeyi: 'Eflak Beyi atlılarıyla ormandan çıktı. Okla erken karşıla.',
  macarbaronu: 'Macar Baronu süvarilerinin başında. Hızlı gelir, sert vurur.',
  fransizkontu: 'Fransız Kontu şövalyelerini sıraya dizdi. Gururlu ve sabırsız; okla karşıla.',
  haclikral: 'Haçlı Kralı sancağıyla karşında. Bu seferin son hamlesi.',
  erdelvoyvoda: 'Erdel Voyvodası süvarileriyle geçidi zorluyor. Derbendi tut.',
  lehsovalye: 'Leh Şövalyesi kralın muhafızı. Zırhı ağır, okun güçlü olmalı.',
  venedikkaptani: 'Venedik Kaptanı kıyıyı arbaletçileriyle tutuyor. Menzile girmeden erit.',
  tabyakomutani: 'Tabya Komutanı arabaların ardında tüfekçilerini diziyor. Tabyayı kır ya da dolaş.',
  surkomutani: 'Sur Komutanı gediği tutuyor. Kalkanlıların arkasından çıkmadan erit.',
  cenevizkomutani: 'Ceneviz Komutanı surların en zayıf yerini savunuyor. Zırhı ağır, ok yağmurunu kesme.',
  sonsancak: 'Son imparatorun sancağı ve muhafızları karşında. Fethin son hamlesi.',
  moradespotu: 'Mora Despotu muhafızlarıyla kalesinin önünde. Askerlerini dağıt.',
  venedikkomutani: 'Venedik Komutanı kıyı kalesini bırakmak istemiyor. Kalabalığı erit.',
  trabzonmuhafizi: 'Trabzon\'un muhafız alayı surların önünde son direnişte.',
  bosnakrali: 'Bosna Kralı ağır süvarisiyle dağ kalesinden indi. En güçlü yayını hazırla.',
  otrantokomutani: 'Otranto Komutanı burcun başında. Bu seferin son hamlesi.',
  hirvatbani: 'Hırvat Banı sınır askerlerinin başında. Önce kalabalığı erit.',
  belgradkomutani: 'Belgrad Komutanı iç kalede son direnişte. Kapı onun arkasında.',
  zirhlibasi: 'Zırhlı Süvari Başı demir zırhlı atıyla hücuma kalktı. Yaklaşmadan önce sayılarını düşür.',
  rodoskulesi: 'Burç Muhafızı şövalyeleriyle surun başında. Zırhları kalın, sabırlı ol.',
  rodosustadi: 'Şövalyelerin Üstadı son burçta. Rodos\'un son hamlesi.',
  husarbasi: 'Hafif Süvari Başı rüzgâr gibi geliyor. Okla erken karşıla.',
  landsknechtbasi: 'Paralı Asker Yüzbaşısı uzun mızraklı askerlerini diziyor. Ok yağmurunu kesme.',
  topcubasi: 'Topçu Başı topların ve arkebüzcülerin başında. Menzile girmeden erit.',
  macarkral: 'Macar Kralının Sancağı ve muhafızları karşında. Mohaç\'ın son hamlesi.',
  avusturyakomutani: 'Avusturya Kumandanı zırhlı süvarisiyle karşında. En güçlü yayını hazırla.',
  budinkomutani: 'Budin Kale Komutanı son burçta. Budin\'in son hamlesi.'
};
const UNLOCK_TXT = {
  2: 'Kaidelerin üstündeki sayıyı okla sıfırla: yeni yay, tuğ ya da Altın Alp senin olur.',
  5: 'Altın Alp kaideleri çıktı. Alp\'ler ordunun önünde yürür, tek başına yirmi akıncı gücünde ok atar.',
  8: 'Kazıklı barikatlar başladı. Çarparsan akıncı kaybedersin; okla kır ya da yanından geç.',
  11: 'Bizans okçuları ilk kez sahada. Yerinden kıpırdamaz, menzile girince ok atar. Önce sen vur.',
  14: 'Bazı kapılarda iki yol da kötü. Az zararlı olanı seç.',
  19: 'Katafraktlar geldi: ağır zırhlı, hızlı süvari. Okla erken karşıla.',
  31: 'Varang Muhafızları sahada: imparatorun baltalı seçkin askerleri.',
  50: 'Yeni sefer: Anadolu\'ya Akın! Akrit süvarileri sahada: Bizans\'ın hızlı sınır atlıları. Ordugâh\'ta 5 yeni basamak açıldı, Çelik Kirişli Yay kaidelerde.',
  52: 'Bizans kervanları yolda. Kervanı okla durdur: ganimeti akçe olarak hazineye eklenir.',
  100: 'Yeni sefer: Haçlılara Karşı! Haçlı piyadeleri ve arbaletçiler geldi. Ordugâh\'ta 5 yeni basamak, kaidelerde Sultan Yayı.',
  103: 'Şövalyeler sahada: Haçlıların demir zırhlı atlıları. Okun gücü yetmezse çarpışmaya girme.',
  105: 'Haçlılar mancınık kurdu. Yolda kırmızı halka beliren yere taş düşer: halkadan uzak dur.',
  150: 'Yeni sefer: Miryokefalon! Kalkanlı ağır piyade sahada. Ordugâh\'ta 5 yeni basamak açıldı.',
  153: 'Dağ geçitleri başladı. Dar boğazda kalabalık ordu sıkışır, bir kısmı geride kalır. Geçide hazırlıklı gir.',
  200: 'Yeni sefer: Selçuklu\'nun Zirvesi! Latin paralı askerleri sahada. Ordugâh\'ta 5 yeni basamak açıldı, kaidelerde Akkiriş Yayı.',
  250: 'Yeni sefer: Uç Beylikleri! Söğüt\'ten batıya akın. Alan süvarileri sahada, Ordugâh\'ta 5 yeni basamak.',
  300: 'Yeni sefer: Rumeli\'ye Geçiş! Katalan paralı askerleri sahada. Ordugâh\'ta 5 yeni basamak, kaidelerde Gazi Yayı.',
  303: 'Yollara hendek kazılmış. Ordunu köprüden geçir: köprüye sığmayan akıncılar hendekte kalır.',
  350: 'Yeni sefer: Kosova! Sırp piyadeleri sahada. Ordugâh\'ta 5 yeni basamak açıldı.',
  353: 'Sırp ağır süvarisi sahada: Balkanlar\'ın demir zırhlı atlıları.',
  400: 'Yeni sefer: Niğbolu! Macar süvarileri ve Haçlı şövalyeleri sahada. Ordugâh\'ta 5 yeni basamak, kaidelerde Yıldırım Yayı.',
  450: 'Yeni sefer: Varna! Ordugâh\'ta 5 yeni basamak açıldı.',
  453: 'Araba tabyaları sahada: zincirle bağlı arabaların ardından tüfekçiler ateş eder. Tabyayı okla kır ya da öbür yandan dolaş.',
  500: 'Yeni sefer: İstanbul\'un Fethi! Ceneviz zırhlıları sahada. Ordugâh\'ta 5 yeni basamak açıldı, kaidelerde Fatih Yayı.',
  502: 'Sur duvarları başladı: yolu baştan başa kapatır. Okla yık; yıkamazsan çarparsın ve akıncı kaybedersin.',
  510: 'Venedik piyadeleri sahada: Haliç\'i savunmaya gelen gemicilerin askerleri.',
  550: 'Yeni sefer: Fatih\'in Seferleri! Venedik piyadeleri ve Sırp süvarileri sahada.',
  600: 'Yeni sefer: Belgrad ve Rodos! Hırvat piyadeleri ve arkebüzcüler sahada, kaidelerde Kanuni Yayı.',
  603: 'Zırhlı Macar şövalyeleri sahada: bugüne kadarki en ağır süvari. Okun gücü yetmezse çarpışmaya girme.',
  630: 'Rodos Şövalyeleri sahada: ağır zırhlı, yavaş ve inatçı piyade.',
  650: 'Yeni sefer: Mohaç! Macar hafif süvarileri sahada.',
  652: 'Toplar ateşte! Yolda kırmızı şerit beliren hattan gülle yuvarlanır: şeritten çekil.',
  655: 'Alman paralı askerleri sahada: uzun mızraklı, kalabalık ve sert.',
  700: 'Yeni sefer: Budin! Tuna boyunda son hesaplaşma.'
};

/* ---------- bölüm üretimi ---------- */
const NL = SEFERLER.length * 50;
const seferOf = i => Math.floor(i / 50);
// bölüme kadar beklenen Ordugâh seviyesi (düşman dayanıklılığı buna göre büyür)
function nominalUp(i) {
  const u = i < 50 ? i * 0.2 : Math.min(upCap(seferOf(i)), i < 500 ? 10 + (i - 50) * 0.09 : 50.5 + (i - 500) * 0.03);
  return { start: u, dmg: u, rate: u, zirh: u * 0.8 };
}

function foeTypeAt(i, r) {
  const pool = POOLS[seferOf(i)].filter(p => p[1] <= i).map(p => p[0]);
  const base = BASE_FOE[seferOf(i)], li = i % 50;
  const w = pool.map(id => id === base ? Math.max(0.35, 1 - li / 60) : FOES[id].atli ? 0.8 : 0.9);
  let s = w.reduce((a, b) => a + b, 0), x = r * s;
  for (let k = 0; k < pool.length; k++) { x -= w[k]; if (x <= 0) return pool[k]; }
  return pool[0];
}

function buildLevel(i, f) {
  if (f === undefined) f = CAL[i] || 1;
  const rnd = rng(i * 7919 + 71);
  const sf = seferOf(i), li = i % 50;
  const d = li / 49, reg = Math.floor(i / 10), k = i % 10, R = REGIONS[reg];
  const st = stats(nominalUp(i));
  const base = (0.78 + 0.62 * d) * Math.min(1, f);   // yapılar (blok, kaide, barikat)
  const hard = base * f;                  // düşmanlar: her bölüm bir tık daha zor (f: araclar/kalibre.js)
  let e = st.start, t = 0, h = 0;
  const dps = () => (e + h * HERO_POW) * st.dmg * WEAPONS[t].m * st.rate;
  const hm = () => +(st.dmg * WEAPONS[t].m * st.rate).toFixed(2);   // düşman erinin ok direnci, oyuncunun beklenen gücüyle büyür
  const objs = [], gates = [];
  const nSeg = Math.min(16 + Math.min(sf, 4), 7 + 2 * Math.min(sf, 5) + Math.floor(li / 4));
  const archer = ARCHER[sf];
  let z = -30, last = '', badLeft = li >= 40 || sf > 0 ? 2 : 1, lastGateBad = false;
  for (let s = 0; s < nSeg; s++) {
    let type;
    if (s === 0) type = 'blocks';
    else if (s % 2 === 1) type = rnd() < 0.85 ? 'gate' : 'blocks';
    else {
      const opts = [['gate', 0.6], ['blocks', 2], ['squad', i >= 1 ? 2.2 + d : 0], ['pedestal', i >= 2 ? 1.6 : 0],
        ['barricade', i >= 8 ? 1 + d : 0], ['archers', i >= 11 && (sf !== 2 || i >= 101) ? 1 + d : 0],
        ['kervan', i >= 52 ? 0.9 : 0], ['tas', i >= 105 ? 1.1 : 0], ['gecit', i >= 153 ? 1.0 : 0],
        ['hendek', i >= 303 ? 1.0 : 0], ['tabur', i >= 453 ? 1.3 : 0],
        ['sur', i >= 502 ? (sf === 10 ? 1.6 : 0.8) : 0], ['gulle', i >= 652 ? 1.3 : 0]];
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
      objs.push({ t: 'squad', ft: archer, x: (rnd() < 0.5 ? -1 : 1) * (1.5 + rnd() * 2.5), z: z - 6, n, hm: hm() });
      e = Math.max(1, e - n * 0.22 * (1 - st.zirh));
    } else if (type === 'kervan') {        // ganimet arabası: okla durdurulursa akçe verir
      const coins = Math.round((20 + 2 * i) * (0.8 + rnd() * 0.5));
      objs.push({ t: 'kervan', x: (rnd() - 0.5) * 6, z: z - 4, hp: Math.max(4, Math.round(dps() * 0.9 * base)), coins, ph: rnd() * 6 });
    } else if (type === 'tas') {           // mancınık taşları: kırmızı halkadan uzak dur
      const n = 2 + Math.floor(rnd() * 2);
      for (let j = 0; j < n; j++) objs.push({ t: 'tas', x: (rnd() < 0.5 ? -1 : 1) * (2.5 + rnd() * 2), z: z - j * 7, r: 2.1 });
      e *= 0.96;
    } else if (type === 'hendek') {        // hendek: yalnız köprüden kayıpsız geçilir
      const bw = 1.7 + rnd() * 0.6, bx = (rnd() - 0.5) * 6;
      objs.push({ t: 'hendek', x: 0, z, bx, bw });
      const R = crowdR(e) * 0.85 + 0.3;
      e = Math.max(1, e * (1 - 0.5 * Math.max(0, R - bw) / (2 * R)));
    } else if (type === 'tabur') {         // araba tabyası: tüfekçili araba duvarı
      const side = rnd() < 0.5 ? -1 : 1;
      objs.push({ t: 'barricade', araba: 1, x: side * 3, z, w: 6, hp: Math.round(dps() * 0.9 * base) });
      const n = Math.max(4, Math.round(e * 1.1 * hard));
      objs.push({ t: 'squad', ft: 'tufekci', x: side * 3, z: z - 3, n, hm: hm() });
      e = Math.max(1, e - n * 0.25 * (1 - st.zirh));
    } else if (type === 'sur') {           // sur duvarı: yolu baştan başa kapatır, okla yıkılır
      objs.push({ t: 'sur', x: 0, z, w: ROAD * 2, hp: Math.round(dps() * 1.6 * base) });
      e *= 0.97;
    } else if (type === 'gulle') {         // top güllesi: kırmızı şeritten yuvarlanır
      const n = 2 + Math.floor(rnd() * 2);
      for (let j = 0; j < n; j++) objs.push({ t: 'gulle', x: (rnd() < 0.5 ? -1 : 1) * (1 + rnd() * 3.5), z: z - j * 9, r: 0.9 });
      e *= 0.95;
    } else if (type === 'gecit') {         // dar geçit: kalabalık ordu sıkışır
      const w = 3.3 + rnd() * 0.8;
      objs.push({ t: 'gecit', x: 0, z, len: 16, w });
      e = Math.max(1, e - Math.max(0, e - gecitCap(w)) * GECIT_LOSS);
    }
    z -= 26;
  }
  let boss = null, finalSquad;
  const bossZ = z - 6;
  if (k === 4 || k === 9) {
    const id = R.bosses[k === 4 ? 0 : 1], tip = BOSSES[id].tip;
    const guard = Math.max(4, Math.round(e * 1.8 * hard / FOES[tip].p));
    objs.push({ t: 'squad', ft: tip, x: 0, z: bossZ + 14, n: guard, hm: hm() });
    e = Math.max(1, e - Math.max(0, guard - dps() * 2 / FOES[tip].hp / hm()) * FOES[tip].p * (1 - st.zirh));
    const hp = Math.round(dps() * (3 + 3 * d) * hard * (k === 9 && reg % 5 === 4 ? 1.4 : 1));
    boss = { t: 'boss', id, x: 0, z: bossZ, hp, kill: Math.max(3, e * 0.07 * hard) };
    objs.push(boss);
  } else {
    const ft = li < 6 ? BASE_FOE[sf] : foeTypeAt(i, rnd());
    const n = Math.max(5, Math.round(e * (2.8 + 0.8 * d) * hard / FOES[ft].p + li));
    finalSquad = { t: 'squad', ft, x: 0, z: bossZ, n, final: true, hm: hm() };
    objs.push(finalSquad);
  }
  let brief = UNLOCK_TXT[i] || '';
  if (boss) brief = (brief ? brief + ' ' : '') + BOSS_TXT[boss.id];
  if (!brief) brief = R.lines[k % 3];
  if (i === 0) brief = 'Sultan Alparslan\'ın akıncıları yola çıktı. Parmağını kaydır, artı kapılardan geç, mavi blokları okla kır. Sondaki Bizans öncülerini dağıt.';
  return { i, sf, reg, k, ad: R.names[k], brief, objs, gates, endZ: bossZ, len: -bossZ + 40, boss: !!boss, reward: 60 + 10 * i };
}
const GECIT_LOSS = 0.3, GULLE_V = 13;
const gecitCap = w => Math.floor(Math.pow((w - 0.3) / (0.34 * 0.85), 2));   // bu genişliğe sığan akıncı sayısı
function pedestalFor(i, rnd, t, h, e, dps, hard) {
  let kind = 'troops';
  if (t < maxTier(i) && (rnd() < 0.62 || i < 5)) kind = 'weapon';
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
const CAL = [0.798,0.857,0.878,0.838,0.814,0.823,0.812,0.983,1.057,0.848,0.825,1.156,0.939,5.141,5.761,2.234,5.531,2.211,4.783,2.032,0.825,0.576,0.834,0.767,0.573,0.673,0.57,0.623,0.459,0.796,0.741,0.589,0.662,0.525,3.75,0.577,0.584,0.681,0.623,0.671,0.506,0.732,0.451,0.581,0.573,0.418,0.42,0.777,0.406,0.601,0.69,0.675,0.979,0.788,0.58,3.358,0.873,1.498,0.703,0.811,1.602,0.73,0.704,0.505,0.579,0.641,0.778,0.578,0.717,0.588,0.825,0.787,0.555,0.567,0.469,0.693,0.797,0.781,0.957,0.593,0.605,0.662,0.622,0.556,0.695,0.281,0.632,0.67,0.62,0.615,0.824,0.413,0.439,0.46,0.557,0.363,0.533,0.393,0.543,0.352,1.036,0.554,0.902,0.689,0.727,0.814,0.623,0.874,1.02,0.814,0.574,0.847,0.92,1.922,0.579,0.881,0.933,0.572,0.703,0.69,0.905,0.761,0.544,0.567,0.811,0.708,0.781,0.763,0.635,0.598,0.278,0.69,0.517,0.459,0.524,0.624,0.462,0.367,0.715,0.382,0.441,0.321,0.548,0.495,0.467,0.359,0.469,0.785,0.535,0.58,0.666,0.986,0.881,0.765,0.446,1.27,0.633,0.834,0.802,0.662,1.502,0.595,0.68,0.747,0.658,0.609,0.665,0.445,0.572,0.571,0.703,0.504,0.746,0.673,0.527,0.449,0.686,0.713,0.685,0.707,0.798,0.779,0.433,0.504,0.53,0.505,0.574,0.392,0.721,0.588,0.502,0.515,0.464,0.537,0.637,0.641,0.279,0.701,0.506,0.371,0.631,0.626,0.906,0.671,0.504,0.56,0.758,0.637,0.537,0.642,0.781,0.533,0.831,0.646,0.627,0.703,0.661,0.568,0.822,0.692,0.415,0.714,0.581,0.746,0.642,0.808,0.645,0.626,0.576,0.576,0.311,0.359,0.474,0.667,0.64,0.681,0.608,0.49,0.669,0.476,0.472,0.586,0.571,0.531,0.636,0.571,0.378,0.542,0.52,0.279,1.061,0.671,1.203,0.763,0.647,0.735,0.412,0.554,0.483,0.626,0.751,0.564,0.694,0.499,0.799,0.711,0.691,0.616,0.868,0.474,0.496,0.881,0.37,0.47,0.654,0.576,0.531,0.694,0.568,0.69,0.578,0.619,0.651,0.499,0.758,0.647,0.458,0.228,0.541,0.481,0.476,0.498,0.541,0.507,0.53,0.592,0.639,0.374,0.592,0.615,0.555,0.631,0.704,0.654,0.533,0.619,0.696,0.553,0.703,0.627,1.277,0.46,0.491,0.562,0.531,0.712,0.625,0.387,0.569,0.606,0.88,0.528,0.627,0.548,0.554,0.611,0.47,0.701,0.568,0.64,0.506,0.507,0.556,0.596,0.492,0.593,0.356,0.516,0.443,0.599,0.48,0.333,0.446,0.779,0.656,0.326,0.561,0.657,0.519,0.672,0.796,0.796,1.095,0.581,0.594,0.583,0.579,0.862,0.491,0.604,0.816,0.866,0.588,0.465,0.935,0.517,0.921,0.547,0.47,0.531,0.684,0.582,0.659,0.9,0.399,0.506,0.561,0.897,0.526,0.462,0.76,0.386,0.631,0.707,0.485,0.4,0.526,0.575,0.63,0.416,0.483,0.307,0.718,0.415,0.598,0.369,0.768,0.421,0.535,0.554,0.55,0.598,0.793,0.711,0.62,0.966,0.796,0.535,0.802,0.744,0.667,0.818,0.717,0.585,0.831,0.525,0.833,0.641,0.644,0.491,0.527,0.575,0.675,0.531,0.359,0.761,0.537,0.597,0.545,0.664,0.461,0.485,0.576,0.601,0.496,0.729,0.522,0.643,0.726,0.521,0.619,0.467,0.548,0.583,0.38,0.688,0.483,0.398,0.484,0.461,0.49,0.67,0.92,0.652,0.809,0.838,0.656,0.883,0.823,0.611,0.581,0.528,0.724,0.646,0.549,0.52,0.421,0.74,0.69,0.631,0.406,0.583,0.41,0.409,0.722,0.571,0.698,0.526,0.504,0.326,0.414,0.638,0.577,0.405,0.364,0.41,0.499,0.701,0.637,0.325,0.393,0.406,0.326,0.647,0.566,0.297,0.497,0.584,0.376,0.41,0.548,0.79,0.675,0.695,0.808,0.802,0.47,0.643,0.705,0.402,0.551,0.445,0.745,0.531,0.641,0.593,0.622,0.719,0.477,0.591,0.642,0.797,0.735,0.54,0.345,0.537,0.542,0.539,0.597,0.587,0.547,0.497,0.732,0.709,0.419,0.328,0.787,0.454,0.475,0.65,0.509,0.812,0.49,0.702,0.327,0.463,0.587,0.765,0.81,0.533,0.619,0.9,0.661,0.39,0.575,0.661,0.524,0.528,0.699,0.57,0.865,0.577,0.684,0.552,0.703,0.459,0.533,0.908,0.683,0.673,0.77,0.475,0.492,0.669,0.598,0.525,0.658,0.723,0.465,0.646,0.798,0.441,0.28,0.409,0.431,0.383,0.24,0.881,0.399,0.393,0.64,0.605,0.52,0.52,0.537,0.434,0.639,0.44,0.54,0.388,0.545,0.785,0.699,0.551,0.496,0.69,0.717,0.968,0.952,0.615,1.012,0.696,0.425,0.889,0.669,0.545,0.496,0.443,0.412,0.415,0.386,0.651,0.641,0.521,0.62,0.853,0.744,0.465,0.708,0.505,0.534,0.379,0.458,0.58,0.499,0.578,0.472,0.456,0.52,0.491,0.454,0.26,0.527,0.328,0.276,0.665,0.458,0.532,0.452,0.454,0.704,0.914,0.598,0.38,0.845,0.756,0.911,1.037,0.476,0.7,0.846,0.473,0.606,0.544,0.462,0.726,1.012,0.867,0.439,0.354,0.347,0.409,0.667,0.71,0.604,0.527,1.027,0.483,0.746,0.713,0.856,0.587,0.665,0.539,0.492,0.222,0.875,0.686,0.375,0.404,0.836,0.498,0.502,0.584,0.529,0.698,0.748,0.597,0.382,0.528,0.494,0.702,0.527,0.383,0.948,0.547,0.627,0.907,0.36,0.697,0.85,0.474,0.421,0.524,0.718,0.647,1.025,0.604,0.298,0.533,0.579,0.779,0.449,0.705,0.81,0.651,0.4,0.669,0.623,0.612,0.574,0.729,0.522,0.845,0.56,0.539,0.449,0.445,0.35,0.587,0.637,0.678,0.5,0.607,0.449,0.522,0.311,0.482,0.59,0.584];
const LEVELS = [];
for (let i = 0; i < NL; i++) LEVELS.push(buildLevel(i));

/* ---------- oyun durumu ve adım fonksiyonu ---------- */
function newGame(i, up) {
  const L = LEVELS[i], st = stats(up), r = rng(i * 31 + 7);
  const G = {
    L, st, rnd: r, i, state: 'play', t: 0, z: 0, x: 0, tx: 0, count: st.start, peak: st.start, heroes: 0, heroHp: 0, wTier: 0,
    fireT: 0, arrows: [], foeShots: [], objs: [], gates: [], events: [], kills: 0, loot: 0, clash: false, march: 0, Rx: 0.5, Rz: 0.5
  };
  for (const o of L.objs) {
    const c = Object.assign({}, o, { alive: true, max: o.hp || o.n, acc: 0, flash: 0 });
    if (c.t === 'block') { c.w = 1.7; c.d = 1.1; }
    if (c.t === 'pedestal') { c.w = 2.5; c.d = 1.5; }
    if (c.t === 'barricade') { c.d = 1.0; }
    if (c.t === 'sur') { c.d = 1.6; }
    if (c.t === 'gulle') { c.z0 = c.z; }
    if (c.t === 'boss') { c.w = 3.4; c.d = 2.4; }
    if (c.t === 'kervan') { c.w = 2.4; c.d = 3.2; c.x0 = c.x; }
    if (c.t === 'squad') { c.start = c.n; c.fireAcc = 0; }
    G.objs.push(c);
  }
  for (const g of L.gates) G.gates.push(Object.assign({ passed: false, side: 0 }, g));
  return G;
}
function totalPow(G) { return (G.count + G.heroes * HERO_POW) * G.st.dmg * WEAPONS[G.wTier].m; }
function ev(G, type, data) { G.events.push(Object.assign({ type }, data)); }

function loseSoldiers(G, k) {
  if (k <= 0) return;
  const c = Math.min(k, G.count); G.count -= c; k -= c;
  if (k > 0 && G.heroes > 0) { G.heroHp -= k; G.heroes = Math.max(0, Math.ceil(G.heroHp / HERO_HP)); if (G.heroes === 0) G.heroHp = 0; }
}
function foeDims(o) {
  const atli = FOES[o.ft].atli, m = Math.min(o.n, atli ? 90 : 160);
  const sx = atli ? 0.8 : 0.55, sz = atli ? 1.1 : 0.6;
  o.cols = Math.max(1, Math.min(atli ? 8 : 12, Math.ceil(Math.sqrt(m * 1.3))));
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
  if (o.t === 'block' || o.t === 'pedestal' || o.t === 'barricade' || o.t === 'sur' || o.t === 'boss' || o.t === 'kervan') {
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
  else if (o.t === 'kervan') { G.loot += o.coins; ev(G, 'loot', { x: o.x, z: o.z, v: o.coins }); }
  else if (o.t === 'pedestal') {
    if (o.kind === 'weapon') { G.wTier = Math.min(WEAPONS.length - 1, Math.max(G.wTier, o.val)); ev(G, 'weapon', { x: o.x, z: o.z, w: G.wTier }); }
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
  let lim = Math.max(0, ROAD - 0.4 - G.Rx);
  for (const o of G.objs) if (o.t === 'gecit' && G.z - G.Rz * 0.5 <= o.z && G.z + G.Rz * 0.5 >= o.z - o.len) lim = Math.min(lim, Math.max(0, o.w - 0.3 - Math.min(G.Rx, o.w - 0.6)));
  G.tx = clamp(G.tx, -lim, lim);
  G.x += (G.tx - G.x) * Math.min(1, dt * 10); G.x = clamp(G.x, -lim, lim);
  if (G.z < G.L.endZ + G.Rz + 1) G.z = G.L.endZ + G.Rz + 1;

  fire(G, dt);
  // oklar
  const near = G.objs.filter(o => o.alive && o.t !== 'tas' && o.t !== 'gecit' && o.t !== 'hendek' && o.t !== 'gulle' && o.z < G.z + 2 && o.z > G.z - 40);
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
    if (o.t === 'kervan') {
      o.x = clamp(o.x0 + Math.sin(G.t * 0.9 + o.ph) * 3.2, -4.2, 4.2);
      if (Math.abs(o.x - G.x) < o.w / 2 + G.Rx * 0.7 && Math.abs(o.z - G.z) < o.d / 2 + G.Rz * 0.7) killObj(G, o, false);
      continue;
    }
    if (o.t === 'tas') {
      if (dist < 26 && !o.warn) { o.warn = true; ev(G, 'tasWarn', { o }); }
      if (G.z <= o.z + 0.3) {
        o.alive = false;
        const hit = Math.abs(G.x - o.x) < o.r + G.Rx * 0.35;
        const loss = hit ? Math.ceil(G.count * 0.15) + 2 : 0;
        if (loss) loseSoldiers(G, loss);
        ev(G, 'tas', { o, v: loss });
      }
      continue;
    }
    if (o.t === 'gulle') {
      if (dist < 34) { if (!o.warn) { o.warn = true; ev(G, 'gulleWarn', { o }); } o.z += GULLE_V * dt; }
      if (!o.done && o.z >= G.z - G.Rz * 0.4) {
        o.done = true;
        if (Math.abs(G.x - o.x) < o.r + G.Rx * 0.5) { const loss = Math.ceil(G.count * 0.12) + 2; loseSoldiers(G, loss); ev(G, 'crash', { x: G.x, z: G.z, v: loss, gulle: true }); }
      }
      if (o.z > G.z + 6) o.alive = false;
      continue;
    }
    if (o.t === 'hendek') {
      if (G.z - G.Rz * 0.2 <= o.z) {
        o.alive = false;
        const f = clamp((G.Rx - (o.bw - Math.abs(G.x - o.bx))) / (2 * G.Rx), 0, 1), loss = Math.ceil(G.count * f * 0.5);
        if (loss > 0) { loseSoldiers(G, loss); ev(G, 'crash', { x: G.x, z: G.z, v: loss, hendek: true }); }
      }
      continue;
    }
    if (o.t === 'gecit') {
      if (!o.done && G.z - G.Rz <= o.z) {
        o.done = true; const loss = Math.ceil(Math.max(0, G.count - gecitCap(o.w)) * GECIT_LOSS);
        if (loss > 0) { loseSoldiers(G, loss); ev(G, 'crash', { x: G.x, z: G.z, v: loss, gecit: true }); }
      }
      if (G.z < o.z - o.len - 4) o.alive = false;
      continue;
    }
    if (o.t === 'block' || o.t === 'pedestal' || o.t === 'barricade' || o.t === 'sur') {
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
    if (dist < -14 && F.v === 0) o.alive = false;   // geride kalan okçular
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
  const loot = G.loot || 0;
  if (win) return Math.round(L.reward * (firstClear ? 1 : 0.35)) + Math.min(80, Math.floor(G.count / 3)) + loot;
  return Math.min(Math.round(L.reward * 0.3), 4 + Math.floor(G.kills / 6)) + loot;
}

const API = { buildLevel, CAL, ROAD, WEAPONS, FOES, UPG, UPMAX, upCap, upCost, stats, REGIONS, SEFERLER, SOON, NL, seferOf, BOSSES, LEVELS, newGame, step, progress, starsOf, rewardOf, applyOp, crowdR, gecitCap, HERO_POW, MAX_HERO };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.MANTIK = API;
})(typeof window !== 'undefined' ? window : globalThis);
