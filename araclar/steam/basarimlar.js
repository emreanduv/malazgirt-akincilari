// Steam başarım listesi (API adı, TR/EN ad ve açıklama). Oyun içi kancalar: www/js/oyun.js → achieve()
const M = require('../../www/js/mantik.js');
const EN = require('../en/r0.js');
const list = [
  { id: 'ILK_ZAFER', tr: ['İlk Zafer', 'İlk bölümü kazan.'], en: ['First Victory', 'Win your first level.'], yil: '★' }
];
M.SEFERLER.forEach((S, i) => list.push({ id: 'SEFER_' + (i + 1), tr: [S.ad, S.ad + ' seferini tamamla.'], en: [EN.seferler[i][0], 'Complete the ' + EN.seferler[i][0] + ' campaign.'], yil: S.yil.split('–').pop() }));
[[100, '100 Yıldız', '100 Stars'], [500, '500 Yıldız', '500 Stars'], [1000, '1000 Yıldız', '1000 Stars'], [2000, '2000 Yıldız', '2000 Stars'], [3000, '3000 Yıldız', '3000 Stars']].forEach(([n, a, b]) =>
  list.push({ id: 'YILDIZ_' + n, tr: [a, 'Toplam ' + n + ' yıldız topla.'], en: [b, 'Collect ' + n + ' stars in total.'], yil: n + '★' }));
list.push({ id: 'YILDIZ_TUM', tr: ['Kusursuz Akıncı', 'Bütün bölümleri 3 yıldızla bitir.'], en: ['Flawless Raider', 'Earn 3 stars on every level.'], yil: '★★★' });
list.push({ id: 'ORDU_999', tr: ['Dev Ordu', 'Ordunu 999 akıncıya çıkar.'], en: ['A Giant Army', 'Grow your army to 999 raiders.'], yil: '999' });
list.push({ id: 'ALP3', tr: ['Üç Alp', 'Aynı bölümde üç Altın Alp topla.'], en: ['Three Alps', 'Gather three Golden Alps in one level.'], yil: 'ALP' });
list.push({ id: 'CIHAN_YAYI', tr: ['Cihan Yayı', 'En güçlü yayı kazan.'], en: ['The World Bow', 'Win the strongest bow.'], yil: 'YAY' });
list.push({ id: 'DEV_3YILDIZ', tr: ['Kusursuz Zafer', 'Bir dev savaşını 3 yıldızla kazan.'], en: ['Perfect Victory', 'Beat a giant with 3 stars.'], yil: 'DEV' });
list.push({ id: 'ORDUGAH', tr: ['Usta Ordugâh', 'Bir geliştirmeyi en üst seviyeye çıkar.'], en: ['Master of the Camp', 'Raise an upgrade to the maximum level.'], yil: 'MAX' });
module.exports = list;
if (require.main === module) {
  const fs = require('fs'), path = require('path'); fs.mkdirSync(path.join(__dirname, '../../store/steam'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../../store/steam/basarimlar.json'), JSON.stringify(list, null, 1));
  console.log(list.length, 'başarım');
}
