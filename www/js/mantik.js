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
  { ad: 'Gök Tuğ Yayı', m: 4.6, c: 0xffe066 },
  { ad: 'Çelik Kirişli Yay', m: 6.2, c: 0xc9f2ff },
  { ad: 'Sultan Yayı', m: 8.2, c: 0xff7ad9 },
  { ad: 'Akıncı Beyi Yayı', m: 10.8, c: 0x9dff8a },
  { ad: 'Yıldırım Yayı', m: 14.2, c: 0xfff4a0 }
];
const maxTier = i => i < 50 ? 4 : i < 100 ? 5 : i < 300 ? 6 : i < 400 ? 7 : 8;

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
  mogol:     { ad: 'Moğol Atlısı',        hp: 1.6, p: 1.5, v: 9.5, atli: 1 },
  mogolagir: { ad: 'Moğol Ağır Süvarisi', hp: 2.8, p: 2.6, v: 7.0, atli: 1 },
  mogolokcu: { ad: 'Moğol Okçusu',        hp: 0.9, p: 0.6, v: 0,   ates: 0.06 },
  balkan:    { ad: 'Balkan Piyadesi',     hp: 1.3, p: 1.2, v: 4.0 },
  sirpatli:  { ad: 'Sırp Süvarisi',       hp: 3.0, p: 2.8, v: 6.8, atli: 1 }
};
/* her seferde sahaya çıkan birlikler: [birlik, ilk bölüm (genel sıra)] */
const POOLS = [
  [['piyade', 0], ['katafrakt', 19], ['varang', 31]],
  [['piyade', 50], ['katafrakt', 50], ['varang', 50], ['akrit', 50]],
  [['frank', 100], ['sovalye', 103]],
  [['piyade', 150], ['katafrakt', 150], ['varang', 150], ['kalkanli', 150]],
  [['mogol', 200], ['mogolagir', 205]],
  [['piyade', 250], ['akrit', 250], ['kalkanli', 256], ['varang', 262]],
  [['piyade', 300], ['akrit', 300], ['katafrakt', 300], ['varang', 300]],
  [['piyade', 350], ['kalkanli', 350], ['varang', 350], ['katafrakt', 350]],
  [['balkan', 400], ['sirpatli', 403], ['kalkanli', 410]],
  [['frank', 450], ['sovalye', 450], ['kalkanli', 450], ['sirpatli', 450]]
];
const ARCHER = ['okcu', 'okcu', 'arbalet', 'okcu', 'mogolokcu', 'okcu', 'okcu', 'okcu', 'okcu', 'arbalet'];
const BASE_FOE = ['piyade', 'akrit', 'frank', 'kalkanli', 'mogol', 'piyade', 'akrit', 'kalkanli', 'balkan', 'frank'];

const UPG = [
  { k: 'start', ad: 'Akıncı Ocağı',  base: 45, desc: l => (3 + 2 * l) + ' akıncıyla yola çık' },
  { k: 'dmg',   ad: 'Ok Ucu',        base: 55, desc: l => 'Ok gücü ×' + (1 + 0.15 * l).toFixed(2) },
  { k: 'rate',  ad: 'Kemankeşhane',  base: 65, desc: l => 'Atış hızı ×' + (1 + 0.1 * l).toFixed(1) },
  { k: 'zirh',  ad: 'Zırhçı Ocağı',  base: 75, desc: l => 'Çatışma kaybı −%' + Math.round(100 * zirhOf(l)) }
];
const UPMAX = 40;
const upCap = sefer => Math.min(UPMAX, 10 + 5 * sefer);   // her yeni sefer Ordugâh'ı 5 basamak açar
function zirhOf(l) { return l <= 10 ? 0.045 * l : Math.min(0.65, 0.45 + 0.01 * (l - 10)); }
function upCost(u, l) { return Math.round(u.base * Math.pow(1.42, Math.min(l, 10)) * Math.pow(1.16, Math.max(0, l - 10))); }
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
  { ad: 'Moğol Fırtınası', yil: '1242–1243', alt: 'Kösedağ ve uç boyları', zafer: 'ANADOLU AYAKTA!',
    epilog: '1243. Kösedağ\'da Selçuklu ordusu Moğollara yenildi; ama akıncılar halkı korudu, Türkmen boyları batıdaki uçlara göçtü. Uçlarda yeni beylikler doğuyordu.' },
  { ad: 'Uç Beyliği', yil: '1288–1299', alt: 'Osman Bey ile Söğüt\'ten', zafer: 'BİLECİK!',
    epilog: '1299. Osman Bey Bilecik, Yarhisar ve İnegöl\'ü aldı. Söğüt\'teki küçük uç beyliği büyük bir devletin tohumu oldu.' },
  { ad: 'Bafeus', yil: '1302', alt: 'Bizans\'la ilk meydan savaşı', zafer: 'BAFEUS!',
    epilog: '27 Temmuz 1302. Muzalon komutasındaki Bizans ordusu İzmit önlerinde dağıldı. Osman Bey\'in adı artık Bizans\'ın kapısında duyuluyordu.' },
  { ad: 'Bursa', yil: '1317–1326', alt: 'Orhan Bey\'in uzun kuşatması', zafer: 'BURSA!',
    epilog: '6 Nisan 1326. Yıllar süren kuşatmadan sonra Bursa teslim oldu. Orhan Bey şehri başkent yaptı.' },
  { ad: 'Kosova', yil: '1389', alt: 'Sultan I. Murad\'ın Balkan seferi', zafer: 'KOSOVA!',
    epilog: '15 Haziran 1389. Balkan ittifakı Kosova Ovası\'nda dağıldı. Sultan Murad savaş meydanında şehit düştü; Yıldırım Bayezid tahta geçti.' },
  { ad: 'Niğbolu', yil: '1396', alt: 'Yıldırım Bayezid ve Haçlı ordusu', zafer: 'NİĞBOLU!',
    epilog: '25 Eylül 1396. Avrupa\'nın dört bir yanından gelen Haçlı ordusu Niğbolu önünde dağıldı. Yıldırım Bayezid\'in ünü bütün Avrupa\'ya yayıldı.' }
];
const SOON = { ad: 'İstanbul\'a Doğru', alt: 'Yeni seferler pek yakında' };

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
  /* ---- 5. sefer: Moğol Fırtınası ---- */
  { ad: 'Erzurum Yaylası', alt: '1242 · Moğollar doğudan geliyor',
    names: ['Erzurum Kalesi', 'Pasinler Ovası', 'Hasankale', 'Aras Kıyısı', 'Palandöken Eteği', 'Tortum Yolu', 'İspir Geçidi', 'Oltu Kalesi', 'Narman Düzü', 'Çoruh Boyu'],
    bosses: ['mogolnoyan', 'tumenbasi'],
    lines: ['Doğudan Moğol tümenleri geldi. Erzurum düştü; akıncılar halkın batıya çekilmesini koruyor.',
            'Moğol atlıları rüzgâr gibi gelir, rüzgâr gibi döner. Oklarını erken konuştur.',
            'Yayla soğuk, yollar uzun. Kapılardan doğru tarafı seç, ordunu büyüt.'] },
  { ad: 'Erzincan Ovası', alt: 'Kervan yolları',
    names: ['Erzincan Kalesi', 'Kemah Boğazı', 'Fırat Kaynağı', 'Tercan Hanı', 'Mama Hatun Kümbeti', 'Refahiye Yolu', 'Kelkit Vadisi', 'Şiran Yaylası', 'Kemaliye Kanyonu', 'İliç Geçidi'],
    bosses: ['tumenbasi', 'mogolnoyan'],
    lines: ['Kervanlar batıya kaçıyor. Moğol öncülerini yoldan çek, ganimeti hazineye kat.',
            'Moğol okçuları tepelere dizilmiş. Menzillerine girmeden önce sen vur.',
            'Fırat\'ın kaynağı burada. Akıncının yolu da buradan batıya akar.'] },
  { ad: 'Kösedağ', alt: '26 Haziran 1243',
    names: ['Kösedağ Eteği', 'Suşehri Ovası', 'Selçuklu Ordugâhı', 'Moğol Öncüleri', 'Sabah Sisi', 'Dağ Yolu', 'Sarp Yamaç', 'Geri Çekiliş', 'Gece Akını', 'Kösedağ Geçidi'],
    bosses: ['tumenbasi', 'baycu'],
    lines: ['Kösedağ\'da Selçuklu ordusu bozuldu. Akıncılar geride kalan halkı ve ağırlıkları kurtarmak için dağa tırmanıyor.',
            'Baycu Noyan\'ın ağır süvarileri vadide. Dar geçitte sıkışma, okla erit.',
            'Bu gece kaçan değil kollayan biziz. Sancağı yere düşürme.'] },
  { ad: 'Sivas Yolu', alt: 'Halkı koru',
    names: ['Zara Hanı', 'Sivas Surları', 'Gök Medrese', 'Kızılırmak Köprüsü', 'Yıldızeli', 'Tokat Yolu', 'Niksar Kalesi', 'Amasya Boğazı', 'Merzifon Ovası', 'Çorum Yolu'],
    bosses: ['mogolnoyan', 'tumenbasi'],
    lines: ['Moğol kolları şehirleri dolaşıyor. Göç eden obaları korumak akıncılara düştü.',
            'Kızılırmak\'ın köprüsünü tut. Ardından gelen kafilenin yolu açık kalsın.',
            'Moğol ağır atlıları yorulmaz. Önce sayılarını erit, sonra dal.'] },
  { ad: 'Uçlara Göç', alt: 'Batıya, yeni yurtlara',
    names: ['Ankara Kalesi', 'Sakarya Başı', 'Sivrihisar', 'Eskişehir Ovası', 'Kütahya Yaylası', 'Afyon Uçları', 'Denizli Uçları', 'Menderes Vadisi', 'Söğüt Yolu', 'Uç Beyleri'],
    bosses: ['tumenbasi', 'baycu'],
    lines: ['Türkmen boyları batıdaki uçlara göçüyor. Moğol kolları peşlerinde.',
            'Uçlarda yeni beylikler kuruluyor. Akıncı, onların kalkanıdır.',
            'Son Moğol kolunu durdur, obalar yurduna kavuşsun.'] },
  /* ---- 6. sefer: Uç Beyliği ---- */
  { ad: 'Söğüt', alt: 'Ertuğrul Gazi\'nin yurdu',
    names: ['Söğüt Yaylası', 'Domaniç Yaylası', 'Ertuğrul Obası', 'Kayı Çadırları', 'Sakarya Kıyısı', 'Kara Tekin', 'Gündüz Alp Yolu', 'Bozüyük', 'Kayı Pınarı', 'Söğüt Ormanı'],
    bosses: ['karacatekfur', 'kumandan'],
    lines: ['Söğüt\'te Kayı boyu yaylada. Genç Osman Bey akıncıları topluyor.',
            'Komşu tekfurların askerleri yaylaya göz dikti. Obayı koru.',
            'Söğüt\'ün ormanları sık. Pusuya dikkat, kapıları akıllı seç.'] },
  { ad: 'Karacahisar', alt: 'İlk fetih',
    names: ['Karacahisar Kalesi', 'Eskişehir Yolu', 'Porsuk Çayı', 'Sabah Akını', 'Kale Kapısı', 'Burç Baskını', 'Tekfur Sarayı', 'Kale Meydanı', 'Pazar Kuruldu', 'Karacahisar Zaferi'],
    bosses: ['karacatekfur', 'strategos'],
    lines: ['Osman Bey\'in ilk büyük hedefi Karacahisar. Kalenin önündeki askerleri dağıt.',
            'Kale okçuları burçlarda. Önce onları sustur.',
            'Karacahisar alınırsa uç beyliği bir pazar, bir şehir kazanır.'] },
  { ad: 'İnegöl', alt: 'Aya Nikola\'nın kalesi',
    names: ['İnegöl Ovası', 'Ermeni Beli', 'Domaniç Geçidi', 'Kulaca Hisar', 'Yenişehir Yolu', 'İnegöl Kalesi', 'Tekfur Pususu', 'Orman Yolu', 'Gece Baskını', 'İnegöl Kapısı'],
    bosses: ['ayanikola', 'akritbeyi'],
    lines: ['İnegöl Tekfuru Aya Nikola uçlara akın düzenliyor. Ermeni Beli\'nde pusu kurmuş.',
            'Dar boğazda ordu sıkışır. Geçide hazırlıklı gir.',
            'Kulaca Hisar yolu kesiyor. Kapıyı aç, ovaya in.'] },
  { ad: 'Yarhisar', alt: 'Düğün alayı',
    names: ['Yarhisar Kalesi', 'Çakırpınar', 'Düğün Alayı', 'Hediye Arabaları', 'Gelin Yolu', 'Kale Kapısı Açıldı', 'Yarhisar Surları', 'Göksu Kıyısı', 'Tekfur Muhafızları', 'Yarhisar Zaferi'],
    bosses: ['yartekfur', 'kalkanbasi'],
    lines: ['Bilecik Tekfuru düğün kuruyor. Osman Bey\'in alpleri hediye arabalarıyla yola çıktı.',
            'Arabalar kapıdan girince alpler ortaya çıkacak. Zamanı iyi kolla.',
            'Yarhisar Tekfuru da düğünde. Kalesini muhafızları tutuyor.'] },
  { ad: 'Bilecik', alt: '1299 · Kale düşüyor',
    names: ['Bilecik Sırtları', 'Kale Yolu', 'Tekfur Bağları', 'Surlar Önü', 'Bilecik Kapısı', 'Burçlar', 'İç Kale', 'Sancak Burcu', 'Çarşı Kuruldu', 'Bilecik Fethi'],
    bosses: ['ayanikola', 'bileciktekfur'],
    lines: ['Bilecik\'in kapıları açıldı. Kale muhafızlarını dağıt, şehri al.',
            'Surların üstünde okçular var. Önce sen vur, sonra yaklaş.',
            'Bilecik alındığında küçük beylik büyük bir devletin yolunu tutacak.'] },
  /* ---- 7. sefer: Bafeus ---- */
  { ad: 'Yenişehir', alt: 'Osman Bey\'in yeni merkezi',
    names: ['Yenişehir Ovası', 'Köprühisar', 'Marmaracık', 'Gölpazarı', 'Koyunhisar Yolu', 'Sakarya Geçidi', 'Geyve Ormanı', 'Akyazı', 'Hendek Sırtları', 'Adapazarı Yolu'],
    bosses: ['alanbeyi', 'kumandan'],
    lines: ['Osman Bey Yenişehir\'i merkez yaptı. Akıncılar Bizans topraklarına, İzmit\'e doğru akıyor.',
            'Köprühisar\'ı tutan askerler yolu kesiyor. Kapılardan büyük çık.',
            'Bizans paralı askerler topluyor. Onlar gelmeden yolu aç.'] },
  { ad: 'Sakarya Boyu', alt: 'Akıncılar kıyıda',
    names: ['Sakarya Kıyısı', 'Akhisar', 'Pamukova', 'Lefke Kalesi', 'Mekece', 'Taraklı', 'Göynük', 'Mudurnu Yolu', 'Sapanca Gölü', 'Kartepe Eteği'],
    bosses: ['alanbeyi', 'katafraktbasi'],
    lines: ['Sakarya boyundaki hisarlar birer birer düşüyor. Bizans kaygılı.',
            'Alan paralı süvarileri Bizans\'ın hizmetinde. Hızlı gelirler, okla erken karşıla.',
            'Sapanca\'nın kıyısında yol dar. Kalabalığı kapıdan geçirirken dikkat.'] },
  { ad: 'İzmit Körfezi', alt: 'Nikomedia önleri',
    names: ['Kartepe Yamacı', 'Derince Kıyısı', 'İzmit Surları', 'Başiskele', 'Gölcük Yolu', 'Karamürsel', 'Değirmendere', 'Hersek Burnu', 'Yalova Yolu', 'Körfez Kıyısı'],
    bosses: ['nikomedia', 'strategos'],
    lines: ['Akıncılar Nikomedia\'nın önünde. Bizans başkentten ordu yolluyor.',
            'Körfezin kıyısında ganimet arabaları var. Durdur, hazineye kat.',
            'Nikomedia Kumandanı surlardan indi. Muhafızlarını erit.'] },
  { ad: 'Koyunhisar', alt: 'Muzalon yaklaşıyor',
    names: ['Koyunhisar Düzü', 'Bizans Öncüleri', 'Alan Paralıları', 'Sis Vadisi', 'Ordugâh Ateşleri', 'Gece Nöbeti', 'Sabah Yürüyüşü', 'Tepe Gözcüleri', 'Bafeus Yolu', 'Savaş Düzeni'],
    bosses: ['alanbeyi', 'nikomedia'],
    lines: ['İmparatorun gönderdiği Muzalon ordusuyla Koyunhisar\'a yaklaştı. Akıncılar karşılıyor.',
            'Gözcüler tepede. Bizans\'ın kanatlarını önceden öğren.',
            'Savaş düzenini kur: okçular önde, alpler ortada.'] },
  { ad: 'Bafeus', alt: '27 Temmuz 1302',
    names: ['Bafeus Ovası', 'Sol Kanat', 'Sağ Kanat', 'Atlı Hücum', 'Muzalon\'un Sancağı', 'Alanlar Çekiliyor', 'Bizans Dağılıyor', 'İzmit\'e Kaçış', 'Kovalama', 'Bafeus Zaferi'],
    bosses: ['nikomedia', 'muzalon'],
    lines: ['Osman Bey ilk büyük meydan savaşında. Bizans ordusu karşında dizildi.',
            'Alan paralıları yerini bırakıyor. Kanatları sıkıştır.',
            'Muzalon\'un sancağı tepede. O düşerse Bizans dağılır.'] },
  /* ---- 8. sefer: Bursa ---- */
  { ad: 'Uludağ Eteği', alt: 'Kuşatma kuruluyor',
    names: ['Uludağ Eteği', 'Kaplıca Yolu', 'Balabancık Hisarı', 'Aktimur Hisarı', 'Soğukpınar', 'İnegöl Yolu', 'Kestel', 'Gürsu Bağları', 'Demirtaş', 'Bursa Ovası'],
    bosses: ['surkumandani', 'kumandan'],
    lines: ['Osman Bey Bursa\'nın çevresine iki hisar kurdurdu. Şehrin yolları birer birer kapanıyor.',
            'Bursa\'dan çıkan kollar hisarlara saldırıyor. Hisarları koru.',
            'Uludağ\'ın eteği bereketli. Ova yolunu açık tut.'] },
  { ad: 'Mudanya Kıyısı', alt: 'Deniz yolu kapanıyor',
    names: ['Mudanya Limanı', 'Tirilye', 'Zeytinbağı', 'Kurşunlu', 'Gemlik Kıyısı', 'Umurbey', 'Kumyaka', 'Güzelyalı', 'Liman Kulesi', 'Kıyı Baskını'],
    bosses: ['kadirgareisi', 'surkumandani'],
    lines: ['Bursa denizden yiyecek alıyor. Kıyıyı tutarsan kuşatma daralır.',
            'Kadırgalardan inen askerler kıyıda. Okla karşıla, denize geri dönsünler.',
            'Zeytinliklerin arasında ganimet arabaları. Durdur, hazineye kat.'] },
  { ad: 'Ulubat Gölü', alt: 'Batı yolları',
    names: ['Ulubat Gölü', 'Gölyazı', 'Ulubat Köprüsü', 'Karacabey Ovası', 'Mihaliç', 'Kirmasti', 'Nilüfer Çayı', 'Görükle', 'Hasanağa', 'Ova Yolu'],
    bosses: ['kadirgareisi', 'katafraktbasi'],
    lines: ['Batıdaki hisarlar Bursa\'ya yardım yolluyor. Yolu kes.',
            'Göl kıyısı geniş ama köprü dar. Kalabalığı kapıdan geçirirken dikkat.',
            'Nilüfer Çayı\'nın kıyısında son konak. Bursa\'nın surları ufukta.'] },
  { ad: 'Bursa Surları', alt: 'Kuşatma sıkılaşıyor',
    names: ['Hisar Kapısı', 'Kaplıca Kapısı', 'Zindan Kapısı', 'Yer Kapısı', 'Pınarbaşı Kapısı', 'Su Yolu', 'Surlar Önü', 'Burç Nöbeti', 'Gece Baskını', 'Tophane Sırtı'],
    bosses: ['surkumandani', 'kalkanbasi'],
    lines: ['Orhan Bey surların önünde. Her kapı ayrı bir savaş.',
            'Surlardan taş yağıyor. Kırmızı halkadan uzak dur.',
            'Kalkanlı muhafızlar kapıları tutuyor. Güçlü yayını hazırla.'] },
  { ad: 'Bursa', alt: '1326 · Başkent Bursa',
    names: ['Kale Teslim', 'Tekfur Sarayı', 'Ulu Sokak', 'Çarşı Kapısı', 'Orhan Bey Geliyor', 'Sancak Asıldı', 'Hanlar Bölgesi', 'Muradiye Yolu', 'Yeşil Bursa', 'Başkent Bursa'],
    bosses: ['kalkanbasi', 'bursatekfur'],
    lines: ['Yıllar süren kuşatma bitiyor. Bursa Tekfuru son muhafızlarıyla direniyor.',
            'Şehrin halkına dokunma, yalnız muhafızları dağıt.',
            'Bursa alınınca beyliğin başkenti olacak.'] },
  /* ---- 9. sefer: Kosova ---- */
  { ad: 'Edirne', alt: 'Sultan ordusunu topluyor',
    names: ['Edirne Sarayı', 'Tunca Kıyısı', 'Meriç Köprüsü', 'Uzunköprü Yolu', 'Kırklareli Bağları', 'Babaeski', 'Lüleburgaz', 'Havsa Ovası', 'Akıncı Ordugâhı', 'Rumeli Yolu'],
    bosses: ['bosnakumandan', 'kumandan'],
    lines: ['Sultan I. Murad Edirne\'de ordusunu topluyor. Balkanlar\'da büyük bir ittifak kuruldu.',
            'Akıncılar ordunun önünde, yolu açıyor. Kapılardan büyük çık.',
            'Meriç\'in köprüsü uzun. Öncüleri karşı kıyıda karşıla.'] },
  { ad: 'Filibe', alt: 'Meriç boyunca',
    names: ['Filibe Kalesi', 'Meriç Vadisi', 'Rodop Eteği', 'İhtiman Geçidi', 'Samakov Yaylası', 'Sofya Yolu', 'Vitoşa Eteği', 'Sofya Ovası', 'İskar Kıyısı', 'Şehirköy'],
    bosses: ['bosnakumandan', 'sirpkumandan'],
    lines: ['Meriç boyunca batıya. Balkan piyadeleri dağ yollarını tutuyor.',
            'İhtiman Geçidi dar. Kalabalık ordu sıkışır, geçide hazırlıklı gir.',
            'Sofya ovasında ittifakın öncüleri. Okla erken karşıla.'] },
  { ad: 'Niş', alt: 'Morava\'ya doğru',
    names: ['Niş Kalesi', 'Morava Kıyısı', 'İttifak Öncüleri', 'Orman Geçidi', 'Dağ Köyleri', 'Vadide Pusu', 'Taş Köprü', 'Kale Gözcüleri', 'Toplica Vadisi', 'Priştine Yolu'],
    bosses: ['sirpkumandan', 'bosnakumandan'],
    lines: ['Morava vadisinde Sırp süvarileri dolaşıyor. Zırhları ağır, atları güçlü.',
            'Vadide pusu var. Kapıları akıllı seç, orduyu dağıtma.',
            'Kosova\'ya giden yol bu vadiden geçer.'] },
  { ad: 'Priştine', alt: 'Ovaya iniş',
    names: ['Priştine Önleri', 'Lab Irmağı', 'Sitniça Kıyısı', 'Ordugâh Kuruldu', 'İttifak Kolları', 'Gözcü Tepeleri', 'Gece Kurultayı', 'Savaş Düzeni', 'Sabah Namazı', 'Kosova Ovası Ufukta'],
    bosses: ['sirpkumandan', 'kalkanbasi'],
    lines: ['İttifak ordusu ovada toplandı. Sultan savaş düzenini kuruyor.',
            'Gözcü tepelerini tut, düşmanın kanatlarını gör.',
            'Yarın büyük gün. Bu gece öncüleri dağıt.'] },
  { ad: 'Kosova Ovası', alt: '15 Haziran 1389',
    names: ['Kosova Ovası', 'Sağ Kanat', 'Sol Kanat', 'Merkez Hattı', 'Süvari Hücumu', 'Akıncılar Kanatta', 'Bayezid\'in Hücumu', 'İttifak Bozuluyor', 'Sultan\'ın Çadırı', 'Kosova Zaferi'],
    bosses: ['bosnakumandan', 'knezsancak'],
    lines: ['İttifak süvarileri ağır zırhlarıyla hücuma kalktı. Akıncılar kanatlarda bekliyor.',
            'Şehzade Bayezid sağ kanatta. Hücumunu destekle.',
            'Ova toz duman. Sancağı düşürme, Balkanlar\'ın kapısı burada açılacak.'] },
  /* ---- 10. sefer: Niğbolu ---- */
  { ad: 'Tuna Kıyısı', alt: 'Haçlılar geliyor',
    names: ['Vidin Önleri', 'Tuna Kıyısı', 'Rahova Kalesi', 'Lom Ağzı', 'Ziştovi', 'Tuna Adaları', 'Kayıklar', 'Kıyı Gözcüleri', 'Rahova Yangını', 'Haçlı Öncüleri'],
    bosses: ['frankkontu', 'sovalyebasi'],
    lines: ['Avrupa\'nın dört bir yanından gelen Haçlı ordusu Tuna\'yı geçti. Akıncılar kıyıda.',
            'Haçlı öncüleri kıyı kalelerine saldırıyor. Yolu kes.',
            'Arbaletçilerin okları sert. Menzile girmeden sayılarını erit.'] },
  { ad: 'Niğbolu Kalesi', alt: 'Kuşatma altındaki kale',
    names: ['Niğbolu Kalesi', 'Kale Kayalıkları', 'Kuşatma Kuleleri', 'Kale Muhafızları', 'Doğan Bey\'in Direnişi', 'Haçlı Mancınıkları', 'Gece Ateşleri', 'Su Kapısı', 'Burç Nöbeti', 'Kale Ayakta'],
    bosses: ['mancinikustasi', 'frankkontu'],
    lines: ['Niğbolu\'yu Doğan Bey savunuyor. Haçlılar kaleyi kuşattı.',
            'Haçlı mancınıkları taş yağdırıyor. Kırmızı halkadan uzak dur.',
            'Kale dayanmalı. Sultan yolda.'] },
  { ad: 'Tırnova Yolu', alt: 'Sultan yetişiyor',
    names: ['Tırnova Kalesi', 'Yantra Kıyısı', 'Balkan Geçidi', 'Hızlı Yürüyüş', 'Gece Konağı', 'Akıncı Öncüleri', 'Orman Yolu', 'Gözcü Tepesi', 'Niğbolu Sırtları', 'Sultan Geldi'],
    bosses: ['sovalyebasi', 'kalkanbasi'],
    lines: ['Yıldırım Bayezid ordusunu yıldırım hızıyla Niğbolu\'ya yürütüyor. Akıncılar önde.',
            'Balkan geçidi dar. Kalabalık ordu sıkışır, hazırlıklı gir.',
            'Haçlı ordugâhı ufukta. Kale hâlâ ayakta.'] },
  { ad: 'Kazık Hattı', alt: 'Tuzak kuruluyor',
    names: ['Kazık Hattı', 'Tepe Yamacı', 'Akıncı Perdesi', 'Şövalye Hücumu', 'Okçu Siperleri', 'Yamaç Savaşı', 'Ağır Şövalyeler', 'Macar Kanadı', 'Eflak Kolu', 'Tepeye Tırmanış'],
    bosses: ['neverskontu', 'sovalyebasi'],
    lines: ['Akıncılar şövalyeleri tepeye, kazık hattına çekiyor. Önde dur, sonra çekil.',
            'Şövalyeler demir zırhlı. Yaklaşmadan önce en güçlü yayını bul.',
            'Kazıklı barikatlar bizim. Düşmanı onlara doğru çek.'] },
  { ad: 'Niğbolu', alt: '25 Eylül 1396',
    names: ['Niğbolu Meydanı', 'Sipahi Hücumu', 'Şövalyeler Sıkıştı', 'Haçlı Ordugâhı', 'Kral\'ın Sancağı', 'Tuna\'ya Kaçış', 'Ganimet', 'Esir Şövalyeler', 'Kale Kurtuldu', 'Niğbolu Zaferi'],
    bosses: ['neverskontu', 'sigismund'],
    lines: ['Şövalyeler tepede yoruldu. Sultan\'ın sipahileri hücumda.',
            'Haçlı Kralı\'nın sancağı Tuna kıyısında. O düşerse ordu dağılır.',
            'Bu zaferden sonra Bayezid\'in adı bütün Avrupa\'da anılacak.'] }

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
  mogolnoyan:    { ad: 'Moğol Noyanı',         tip: 'mogol',     renk: 0x6a4a2a },
  tumenbasi:     { ad: 'Tümen Başı',           tip: 'mogolagir', renk: 0x4a3a2a },
  baycu:         { ad: 'Baycu Noyan',          tip: 'mogolagir', renk: 0x2a2a2a },
  karacatekfur:  { ad: 'Karacahisar Tekfuru',  tip: 'piyade',    renk: 0x8e2a4a },
  ayanikola:     { ad: 'İnegöl Tekfuru',       tip: 'akrit',     renk: 0x7a3a2a },
  yartekfur:     { ad: 'Yarhisar Tekfuru',     tip: 'piyade',    renk: 0x6a2a6a },
  bileciktekfur: { ad: 'Bilecik Tekfuru',      tip: 'varang',    renk: 0x5a1b5a },
  alanbeyi:      { ad: 'Alan Beyi',            tip: 'akrit',     renk: 0x5a6a3a },
  nikomedia:     { ad: 'Nikomedia Kumandanı',  tip: 'varang',    renk: 0x4a2a6a },
  muzalon:       { ad: 'Muzalon',              tip: 'katafrakt', renk: 0x6a1b5a },
  surkumandani:  { ad: 'Sur Kumandanı',        tip: 'kalkanli',  renk: 0x7a3a2a },
  kadirgareisi:  { ad: 'Kadırga Reisi',        tip: 'piyade',    renk: 0x2a4a7a },
  bursatekfur:   { ad: 'Bursa Tekfuru',        tip: 'varang',    renk: 0x6a1b4a },
  bosnakumandan: { ad: 'Bosna Kumandanı',      tip: 'balkan',    renk: 0x2a5a8a },
  sirpkumandan:  { ad: 'Sırp Kumandanı',       tip: 'sirpatli',  renk: 0x9a2a2a },
  knezsancak:    { ad: 'İttifak Sancağı',      tip: 'sirpatli',  renk: 0xc8c0b0 },
  neverskontu:   { ad: 'Nevers Kontu',         tip: 'sovalye',   renk: 0x2a3a8a },
  sigismund:     { ad: 'Haçlı Kralının Sancağı', tip: 'sovalye', renk: 0xd8d0c0 }
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
  mogolnoyan: 'Moğol Noyanı atlılarıyla yolu kesti. Hızlı gelir, okla erken karşıla.',
  tumenbasi: 'Tümen Başı ağır süvarilerin önünde. Zırhları kalın, en güçlü yayını hazırla.',
  baycu: 'Baycu Noyan karşında. Onu durdurursan obalar batıya güvenle geçer.',
  karacatekfur: 'Karacahisar Tekfuru kalesinin önünde. Muhafızlarını dağıt, kale senin.',
  ayanikola: 'İnegöl Tekfuru Aya Nikola atlılarıyla pusuda. Önce kalabalığı erit.',
  yartekfur: 'Yarhisar Tekfuru muhafızlarıyla kapıyı tutuyor. Bu kapı açılırsa Bilecik yakın.',
  bileciktekfur: 'Bilecik Tekfuru iç kalede son direnişte. Bu seferin son hamlesi.',
  alanbeyi: 'Alan Beyi paralı süvarileriyle karşında. Hızlıdırlar ama çabuk bozulurlar.',
  nikomedia: 'Nikomedia Kumandanı baltalı muhafızlarıyla geldi. Çatışmadan önce yarısını düşür.',
  muzalon: 'Muzalon ve zırhlı atlıları karşında. Bafeus\'un son hamlesi, Akıncı Bey.',
  surkumandani: 'Sur Kumandanı kalkanlı muhafızlarıyla kapıyı tutuyor. Kalkanları delmek için güçlü yay gerek.',
  kadirgareisi: 'Kadırga Reisi askerlerini kıyıya çıkardı. Denize geri dön, desinler.',
  bursatekfur: 'Bursa Tekfuru son muhafızlarıyla karşında. Bursa\'nın kapıları onun arkasında.',
  bosnakumandan: 'Bosna Kumandanı piyadelerini sıraya dizdi. Önce kalabalığı erit.',
  sirpkumandan: 'Sırp Kumandanı ağır süvarileriyle hücuma kalktı. Ok yağmurunu kesme.',
  knezsancak: 'İttifakın sancağı ve ağır süvarileri karşında. Kosova\'nın son hamlesi.',
  neverskontu: 'Nevers Kontu şövalyelerinin başında tepeye tırmanıyor. En güçlü yayını hazırla.',
  sigismund: 'Haçlı Kralı\'nın sancağı ve muhafızları karşında. Niğbolu\'nun son hamlesi.'
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
  200: 'Yeni sefer: Moğol Fırtınası! Moğol atlıları ve okçuları sahada. Ordugâh\'ta 5 yeni basamak açıldı.',
  205: 'Moğol ağır süvarileri geldi: kalın zırhlı, yorulmaz atlılar. Okla erken karşıla.',
  250: 'Yeni sefer: Uç Beyliği! Osman Bey akıncıları Söğüt\'te topluyor. Ordugâh\'ta 5 yeni basamak açıldı.',
  300: 'Yeni sefer: Bafeus! Ordugâh\'ta 5 yeni basamak açıldı, kaidelerde Akıncı Beyi Yayı.',
  350: 'Yeni sefer: Bursa! Orhan Bey\'in kuşatması başlıyor. Ordugâh\'ta 5 yeni basamak açıldı.',
  400: 'Yeni sefer: Kosova! Balkan piyadeleri sahada. Kaidelerde Yıldırım Yayı.',
  403: 'Sırp süvarileri geldi: ağır zırhlı, güçlü atlılar. Okun gücü yetmezse çarpışmaya girme.',
  450: 'Yeni sefer: Niğbolu! Avrupa\'nın Haçlı ordusu Tuna\'yı geçti. Şövalyeler ve arbaletçiler sahada.'
};

/* ---------- bölüm üretimi ---------- */
const NL = SEFERLER.length * 50;
const seferOf = i => Math.floor(i / 50);
// bölüme kadar beklenen Ordugâh seviyesi (düşman dayanıklılığı buna göre büyür)
function nominalUp(i) {
  const u = i < 50 ? i * 0.2 : Math.min(upCap(seferOf(i)), 10 + (i - 50) * 0.09);
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
  const nSeg = Math.min(16 + Math.min(sf, 4), 7 + 2 * sf + Math.floor(li / 4));
  const archer = ARCHER[sf];
  let z = -30, last = '', badLeft = li >= 40 || sf > 0 ? 2 : 1, lastGateBad = false;
  for (let s = 0; s < nSeg; s++) {
    let type;
    if (s === 0) type = 'blocks';
    else if (s % 2 === 1) type = rnd() < 0.85 ? 'gate' : 'blocks';
    else {
      const opts = [['gate', 0.6], ['blocks', 2], ['squad', i >= 1 ? 2.2 + d : 0], ['pedestal', i >= 2 ? 1.6 : 0],
        ['barricade', i >= 8 ? 1 + d : 0], ['archers', i >= 11 && (sf !== 2 || i >= 101) ? 1 + d : 0],
        ['kervan', i >= 52 ? 0.9 : 0], ['tas', i >= 105 ? 1.1 : 0], ['gecit', i >= 153 ? 1.0 : 0]];
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
const GECIT_LOSS = 0.3;
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
const CAL = [0.798,0.857,0.878,0.838,0.814,0.823,0.812,0.983,1.057,0.848,0.825,1.156,0.939,5.141,5.761,2.234,5.531,2.211,4.783,2.032,0.825,0.576,0.834,0.767,0.573,0.673,0.57,0.623,0.459,0.796,0.741,0.589,0.662,0.525,3.75,0.577,0.584,0.681,0.623,0.671,0.506,0.732,0.451,0.581,0.573,0.418,0.42,0.777,0.406,0.601,0.69,0.675,0.979,0.788,0.58,3.358,0.873,1.498,0.703,0.811,1.602,0.73,0.704,0.505,0.579,0.641,0.778,0.578,0.717,0.588,0.825,0.787,0.555,0.567,0.469,0.693,0.797,0.781,0.957,0.593,0.605,0.662,0.622,0.556,0.695,0.281,0.632,0.67,0.62,0.615,0.824,0.413,0.439,0.46,0.557,0.363,0.533,0.393,0.543,0.352,1.036,0.554,0.902,0.689,0.727,0.814,0.623,0.874,1.02,0.814,0.574,0.847,0.92,1.922,0.579,0.881,0.933,0.572,0.703,0.69,0.905,0.761,0.544,0.567,0.811,0.708,0.781,0.763,0.635,0.598,0.278,0.69,0.517,0.459,0.524,0.624,0.462,0.367,0.715,0.382,0.441,0.321,0.548,0.495,0.467,0.359,0.469,0.785,0.535,0.58,0.666,0.986,0.881,0.765,0.446,1.27,0.633,0.834,0.802,0.662,1.502,0.595,0.68,0.747,0.658,0.609,0.665,0.445,0.572,0.571,0.703,0.504,0.746,0.673,0.527,0.449,0.686,0.713,0.685,0.707,0.798,0.779,0.433,0.504,0.53,0.505,0.574,0.392,0.721,0.588,0.502,0.515,0.464,0.537,0.637,0.641,0.279,0.701,0.506,0.371,0.645,0.634,0.95,0.66,0.501,0.559,0.765,0.655,0.557,0.676,0.818,0.545,0.775,0.66,0.632,0.711,0.714,0.557,0.886,0.689,0.393,0.741,0.557,0.843,0.634,0.825,0.673,0.63,0.571,0.574,0.361,0.369,0.472,0.66,0.643,0.697,0.624,0.49,0.684,0.487,0.481,0.584,0.622,0.585,0.622,0.581,0.253,0.539,0.521,0.283,1.082,0.686,1.208,0.769,0.648,0.741,0.437,0.58,0.474,0.62,0.721,0.578,0.699,0.513,0.79,0.711,0.691,0.599,0.901,0.445,0.489,0.885,0.365,0.49,0.627,0.559,0.531,0.697,0.612,0.689,0.576,0.657,0.652,0.481,0.792,0.669,0.46,0.228,0.54,0.482,0.504,0.527,0.536,0.53,0.522,0.602,0.643,0.374,0.592,0.616,0.564,0.618,0.803,0.87,0.689,0.755,0.673,0.611,0.735,0.745,1.091,0.713,0.596,0.554,0.888,0.547,0.637,0.606,0.524,0.775,0.741,0.823,0.636,0.64,0.541,0.572,0.539,0.756,0.503,0.524,0.527,0.566,0.599,0.402,0.545,0.436,0.732,0.467,0.416,0.597,0.508,0.634,0.406,0.599,0.575,0.313,0.516,0.685,0.435,0.711,0.788,0.881,0.997,0.583,0.733,0.713,0.564,0.823,0.967,0.586,1.003,0.652,0.767,0.866,0.597,0.755,0.575,0.412,0.48,0.521,0.638,0.66,0.535,0.711,0.576,0.517,0.573,0.823,0.729,0.656,0.656,0.417,0.493,0.612,0.676,0.529,0.614,0.542,0.629,0.47,0.436,0.584,0.434,0.496,0.556,0.342,0.465,0.467,0.588,0.272,0.867,0.869,0.936,0.69,0.891,0.817,1.037,0.741,0.914,0.452,0.565,0.73,0.75,0.6,0.802,0.708,0.862,0.635,0.746,0.644,0.717,0.611,0.746,0.633,0.296,0.933,0.41,0.633,0.636,0.542,0.546,0.453,0.536,0.594,0.571,0.64,0.613,0.496,0.641,0.638,0.654,0.622,0.597,0.427,0.403,0.72,0.586,0.818,0.578,0.313,1.48,0.648,0.743,0.612,0.728,0.614,0.53,0.605,0.702,0.873,0.673,0.427,0.688,0.784,0.555,0.681,0.993,0.68,0.77,0.549,0.892,0.645,0.972,0.534,0.635,0.588,0.689,0.469,0.671,0.763,0.465,0.629,0.731,0.578,0.583,0.601,0.472,0.423,0.667,0.43,0.483,0.373,0.576,0.58,0.453,0.449,0.446,0.514,0.368,0.781];
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
    if (c.t === 'boss') { c.w = 3.4; c.d = 2.4; }
    if (c.t === 'kervan') { c.w = 2.4; c.d = 3.2; c.x0 = c.x; }
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
  if (o.t === 'block' || o.t === 'pedestal' || o.t === 'barricade' || o.t === 'boss' || o.t === 'kervan') {
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
  const near = G.objs.filter(o => o.alive && o.t !== 'tas' && o.t !== 'gecit' && o.z < G.z + 2 && o.z > G.z - 40);
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
    if (o.t === 'gecit') {
      if (!o.done && G.z - G.Rz <= o.z) {
        o.done = true; const loss = Math.ceil(Math.max(0, G.count - gecitCap(o.w)) * GECIT_LOSS);
        if (loss > 0) { loseSoldiers(G, loss); ev(G, 'crash', { x: G.x, z: G.z, v: loss, gecit: true }); }
      }
      if (G.z < o.z - o.len - 4) o.alive = false;
      continue;
    }
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
    if (dist < -14 && (o.ft === 'okcu' || o.ft === 'mogolokcu')) o.alive = false;   // geride kalan okçular
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
