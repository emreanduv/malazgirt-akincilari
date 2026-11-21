/* Mr. Anduv! eşitleme (G84): oyun/uygulama kaydı cihazlar arasında kaldığı yerden devam eder.
   iPhone, iPad, Mac: Apple'ın iCloud anahtar-değer deposu (NSUbiquitousKeyValueStore; yerel eklenti "Esitle",
   ios/App/App/SceneDelegate.swift). Sunucu yok, üyelik yok; veri kullanıcının kendi iCloud hesabında durur.
   Android: telefon değişince Google'ın kendi yedeği (android:allowBackup) geri yükler. Web/VR/Steam: yerel kalır.
   Kullanım: <script>window.ESITLE_ANAHTARLAR = ['oyunun-kayit-anahtari'];</script><script src="esitle.js"></script>
   oyun betiklerinden ÖNCE. Kural: en son yazılan kazanır (her anahtarın yanında zaman damgası "anahtar·t"). */
(function () {
  'use strict';
  var C = window.Capacitor, yerli = !!(C && C.isNativePlatform && C.isNativePlatform());
  var P = yerli ? ((C.Plugins && C.Plugins.Esitle) || (C.isPluginAvailable && C.isPluginAvailable('Esitle') && C.registerPlugin ? C.registerPlugin('Esitle') : null)) : null;
  var ANAH = (window.ESITLE_ANAHTARLAR || []).slice();
  var E = window.ESITLE = { durum: P ? 'bekliyor' : 'yok', anahtarlar: ANAH, son: 0, bekleyen: false };
  if (!P || !ANAH.length) return;

  var LS = window.localStorage, setI = Storage.prototype.setItem, remI = Storage.prototype.removeItem, getI = Storage.prototype.getItem;
  var izli = function (k) { return ANAH.indexOf(k) >= 0; };
  var tk = function (k) { return k + '·t'; };
  var yerelT = function (k) { return +(getI.call(LS, tk(k)) || 0); };
  var zamanlayici = 0, kirli = {}, hazir = false, erken = {};

  function gonder() {
    zamanlayici = 0; var d = {}, n = 0;
    for (var k in kirli) { var v = getI.call(LS, k); d[k] = JSON.stringify({ t: yerelT(k), v: v }); n++; }
    kirli = {}; if (!n) return;
    P.yaz({ degerler: d }).then(function () { E.son = Date.now(); E.durum = 'esit'; }).catch(function () { E.durum = 'hata'; });
  }
  // İlk karşılaştırma bitmeden oyunun yaptığı yazışlar damgalanmaz: buluttaki daha yeni kayıt ezilmesin
  function isaretle(k) { if (!hazir) { erken[k] = 1; return; } setI.call(LS, tk(k), String(Date.now())); kirli[k] = 1; if (!zamanlayici) zamanlayici = setTimeout(gonder, 1500); }

  // Oyunun kendi yazışları: yerel yazılır, zaman damgası güncellenir, 1,5 sn sonra buluta gider
  Storage.prototype.setItem = function (k, v) { setI.call(this, k, v); if (this === LS && izli(k)) isaretle(k); };
  // Silme ("Verilerimi sil") hemen buluta da gider: kayıt bütün cihazlardan silinir
  Storage.prototype.removeItem = function (k) { remI.call(this, k); if (this === LS && izli(k)) { isaretle(k); if (hazir) { clearTimeout(zamanlayici); gonder(); } } };

  // Buluttakiyle karşılaştır: yenisi buluttaysa yerele yaz (true döner), yerel yeniyse buluta gönder
  function karsilastir() {
    return P.oku({ anahtarlar: ANAH }).then(function (r) {
      var b = (r && r.degerler) || {}, degisti = false;
      E.icloud = !!(r && r.icloud);
      ANAH.forEach(function (k) {
        var bulut = null; try { bulut = b[k] ? JSON.parse(b[k]) : null; } catch (e) {}
        var yt = yerelT(k), yv = getI.call(LS, k);
        if (bulut && bulut.t > yt) {
          if (bulut.v !== yv) { if (bulut.v == null) remI.call(LS, k); else setI.call(LS, k, bulut.v); degisti = true; }
          setI.call(LS, tk(k), String(bulut.t));
        } else if (yv != null && (!bulut || yt > bulut.t)) {
          if (!yt) setI.call(LS, tk(k), String(Date.now()));
          kirli[k] = 1;
        }
      });
      if (!hazir) { hazir = true; if (!degisti) for (var k2 in erken) isaretle(k2); erken = {}; }
      gonder(); E.durum = 'esit'; E.son = Date.now();
      return degisti;
    }).catch(function () { E.durum = 'hata'; if (!hazir) { hazir = true; for (var k3 in erken) isaretle(k3); erken = {}; } return false; });
  }
  // Başka cihazdaki ilerleme geldiyse oyun en baştan o kayıtla açılır (tek sefer; döngü olmaz)
  function yenile(degisti) {
    if (!degisti) return;
    var b = 'esitle-yenilendi', s = window.sessionStorage;
    try { if (s.getItem(b) && Date.now() - +s.getItem(b) < 5000) return; s.setItem(b, String(Date.now())); } catch (e) {}
    location.reload();
  }

  karsilastir().then(yenile);
  // Oyun sırasında gelen değişiklik oyunu bölmez: uygulamaya dönüldüğünde uygulanır
  P.addListener('degisti', function () { E.bekleyen = true; });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { if (zamanlayici) { clearTimeout(zamanlayici); gonder(); } return; }
    karsilastir().then(function (d) { E.bekleyen = false; yenile(d); });
  });
  window.addEventListener('pagehide', function () { if (zamanlayici) { clearTimeout(zamanlayici); gonder(); } });
})();
