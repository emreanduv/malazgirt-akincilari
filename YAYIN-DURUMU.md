# Malazgirt Akıncıları — Yayın durumu (14 Ekim 2026)

## App Store (iOS)
- Durum: **Waiting for Review** (sürüm 1.0.0, derleme 1)
- App Store Connect uygulama no: 6822718671 · Bundle ID `com.anduv.malazgirt` · SKU `malazgirt-akincilari`
- Kategori: Oyunlar → Aksiyon, Strateji · Yaş: 9+ · Fiyat: Ücretsiz, 175 ülke
- Gizlilik: Data Not Collected (yayınlandı) · Politika: https://claude.ai/artifact/43bGxpeyeirDMs3kTxexB4 (herkese açık olmalı)
- Ekran görüntüleri: 5 iPhone 6.9" + 5 iPad 13" (GitHub iş akışı "App Store ekran görüntüleri" ile yüklendi)

## Google Play (Android)
- Durum: **Kapalı test (Alpha) incelemede**
- Uygulama no: 4975381568645142300 · Paket `com.anduv.malazgirt`
- Sürüm: 2 (1.0.0), hedef SDK 36, 177 ülke
- İçerik derecelendirmesi: ESRB 10+, PEGI 3, USK 12 · Hedef kitle 13+ · Veri toplanmıyor · Reklam yok
- Test kullanıcıları: "Hisar Testçileri" e-posta listesi (şu an 1 kişi — üretime çıkmak için en az 12 kişi × 14 gün)

## Yükleme (imza) anahtarı — KAYBETME
- Bilgisayar: `imza-anahtari/` (git dışında)
- Google Drive: "Malazgirt Akıncıları — Yedekler" klasörü
- Alias `malazgirt`, şifre `SIFRE-OKU.txt` içinde
- SHA-256: E3:BC:3A:B0:3C:4B:40:DF:29:F3:D3:EE:D8:27:DA:1F:AB:A1:88:EF:E2:46:3B:36:A0:0C:C7:4F:F1:61:34:F9

## Güncelleme çıkarma
1. `www/` içinde değişiklik → GitHub'a gönder.
2. iOS: Actions → "iOS (App Store Connect / TestFlight)" → sürüm adını artır (ör. 1.0.1).
3. Android: Actions → "Android (Google Play paketi)" → `builds` dalındaki imzasız `.aab`'yi `imza-anahtari` ile imzala:
   `jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore imza-anahtari/malazgirt-upload.jks paket.aab malazgirt`
   → Play Console'da yeni sürüm olarak yükle.

## 1.0.1 (14 Ekim 2026, iPhone testinden sonra)
- Bölüm 2 geliştirme almadan iki kez kaybedildi → zorluk acemi oyuncuya göre yeniden ayarlandı (araclar/kalibre.js).
- Geliştirme alınabilirken menü, brifing ve zafer ekranında uyarı.
- iOS: TestFlight'a 1.0.1 yüklendi. Android: `imza-anahtari/malazgirt-1.0.1-3-imzali.aab` hazır.

## 1.1.0 (hazırlanıyor): 200 bölüm, 4 sefer
- Seferler: Malazgirt (1–50), Anadolu'ya Akın (51–100), Haçlılara Karşı (101–150), Miryokefalon (151–200)
- Yeni düşmanlar: Akrit, Haçlı piyadesi, Arbaletçi, Şövalye, Kalkanlı; yeni mekanikler: kervan (akçe), mancınık halkası, dar geçit
- Ordugâh 30 seviye (her sefer +5 açar), 7 yay
- Zorluk: araclar/kalibre.js, "ortalama oyuncu" botu %95 → %25 testere dişi
- Mağaza metinleri: store/surum-1.1.md
- Yeni sefer eklemek: mantik.js'te SEFERLER'e 1, REGIONS'a 5 bölge, POOLS/ARCHER/BASE_FOE'ya 1 satır; oyun.js THEMES'e 5 tema; sonra `node araclar/kalibre.js 201`

## 1.2.0 (22 Ekim 2026): 500 bölüm, 10 sefer
- Yeni seferler: Selçuklu'nun Zirvesi (201–250), Uç Beylikleri (251–300), Rumeli'ye Geçiş (301–350), Kosova (351–400), Niğbolu (401–450), Varna (451–500)
- Yeni birlikler: Latin, Alan, Katalan, Sırp piyade/ağır süvari, Macar süvari, araba tüfekçisi; yeni mekanikler: hendek+köprü (303+), araba tabyası (453+)
- 10 yay, Ordugâh 60 seviye tavanı (her sefer +5; 10. seferde 55)
- Zorluk: 201–500 ortalama oyuncu %56 → %20; kalibrasyon iki işlemle paralel: `node araclar/kalibre.js 201 350` ve `node araclar/kalibre.js 351 500`
- Mağaza metinleri: store/surum-1.2.md · Ekran görüntüleri yenilendi (03: Haçlı Kralı, 04: Niğbolu haritası)
- Yol haritası: 200 → 500 → 1071 bölüm

## 1.3.0 (23 Ekim 2026): 750 bölüm, 15 sefer
- Yeni seferler: İstanbul'un Fethi (501–550), Fatih'in Seferleri (551–600), Belgrad ve Rodos (601–650), Mohaç (651–700), Budin (701–750)
- Yeni birlikler: Ceneviz zırhlısı, Venedik piyadesi, arkebüzcü, Hırvat piyadesi, zırhlı Macar şövalyesi, Rodos Şövalyesi, Macar hafif süvarisi, Alman paralı askeri
- Yeni mekanikler: sur duvarı (502+, yolu baştan başa keser, okla yıkılır), top güllesi (652+, kırmızı şeritten yuvarlanır)
- 12 yay (Fatih Yayı, Kanuni Yayı), Ordugâh tavanı 60; 500 sonrası düşman gücü daha yavaş büyür (nominalUp)
- Zorluk: 501–750 ortalama oyuncu %48 → %18; kalibrasyon üç işlemle: `node araclar/kalibre.js 501 584`, `585 667`, `668 750`; sonra 606, 619, 638, 699, 727 elle yumuşatıldı
- Kayıt göçü genelleştirildi: son bitirilen bölümün ardındaki bölüm her zaman açılır
- Mağaza metinleri: store/surum-1.3.md · Ekran görüntüleri: 01 yenilendi, 03 Fetih devi, 04 Kara Surları haritası
- Yol haritası: 750 → 1071 (1.4) → 1453 → 1923
- Derlemeler: iOS 1.3.0 (9) TestFlight'a yüklendi; Android 6 (1.3.0) imzalı, `imza-anahtari/malazgirt-1.3.0-6-imzali.aab`, Play kapalı test Alpha'ya eklendi; App Store 1.3.0 sürümü metin ve görsellerle açıldı

## 1.4.0 (24 Ekim 2026, onaylandı): 1071 bölümlük özel sürüm, 22 sefer
- Yeni seferler: Zigetvar (751–800), Kıbrıs (801–850), Haçova (851–900), Girit (901–950), Uyvar ve Kamaniçe (951–1000), Prut (1001–1050), Malazgirt'e Dönüş (1051–1071, 3 bölge: 10+10+1)
- Yapı değişti: seferler `nb` bölgeden, bölgeler `n` bölümden oluşabilir (mantik.js: levelPos, SEF0, SEFR0, REG0)
- Yol: 1–300 2 şerit, 301–700 3 şerit, 701+ 4 şerit (lanesOf/roadOf); kapılar şerit sayısı kadar seçenek (`gate.opts`)
- Hız: speedOf(i) = 9 × (1 + 0,5 × i/1922) → 1923. bölümde %50 daha hızlı
- Zorluk: yeni hedef eğrisi (kalibre.js target): 15. bölümden sonra belirgin biçimde sertleşir; 1071 bölümün hepsi yeniden kalibre edildi
- Görsel: her bölümde gün saati / hava / mevsim (oyun.js MOODS, moodOf; `?hava=gece` ile zorlanabilir), yağmur ve kar parçacıkları, gece meşaleleri, düşen akıncılar ve kayıp sayıları
- 7 yeni birlik (kürasiyer, tüfekçi, stradiot, kanatlı süvari, Kazak, Rus piyadesi, grenadiyer), 2 yeni yay (Köprülü, Alparslan)
- Mağaza metinleri: store/surum-1.4.md
- Derlemeler: iOS 1.4.0 (10) TestFlight'a yüklendi; Android 7 (1.4.0) imzalı (`imza-anahtari/malazgirt-1.4.0-7-imzali.aab`), Play kapalı test Alpha'ya eklendi; App Store 1.4.0 sürümü metin ve görsellerle açıldı
- Denge (bütün bölümleri sırayla oynayan botlar): ortalama oyuncu 16–100 arası ilk denemede %76, 751–1071 arası %44; takılan bölüm yok. Takılma çıkarsa: `LIMIT=8 node araclar/duzelt.js`

## 1.5.0 (hazırlanıyor): 1453 bölüm, 30 sefer; Steam (Windows, macOS, Linux/Pardus)
- Yeni seferler: Mora 1715, Belgrad 1739, Şebeş 1788, Akka 1799, Silistre 1854, Plevne 1877, Dömeke 1897, Fetih Yolu (1453. bölüm finali; 3 bölge: 10+10+12)
- 5 yeni birlik (Avusturya piyadesi, Fransız piyadesi ve süvarisi, nişancı, Yunan piyadesi), 13 yeni dev, 2 yeni yay (Mehter, Cihan)
- Dil: Türkçe + İngilizce (www/js/dil.js arayüz sözlüğü; içerik çevirisi araclar/en/r0–r5.js → `node araclar/en/derle.js` → www/js/icerik-en.js)
- Ayarlar ekranı: dil, ses efekti ve mehter düzeyi, grafik kalitesi, tam ekran (masaüstü), satın alımı geri yükle (mobil)
- Fiyat:
  - Mobil: ücretsiz, ilk 100 bölüm açık; "Tam Sürüm" tek seferlik ürün `com.anduv.malazgirt.tamsurum` (1,99 $). Eski oyuncular bulundukları yerin üstündeki ilk eşiğe kadar ücretsiz devam eder: 100 / 250 / 500 / 1000 (ör. 244. bölümdeki oyuncu 250'ye kadar; 1000'i geçmiş olan hepsini açık bulur). Sonra tek seferlik 1,99 $.
  - Steam: 1,99 $ tam oyun (uygulama içi satın alım yok).
- Masaüstü: `desktop/` (Electron + steamworks.js). Steam başarımları (42; araclar/steam/basarimlar.js → store/steam/basarimlar.json, ikonlar store/steam/basarim-ikon), Steam Cloud kayıt, oyun kolu, F11 tam ekran.
  - Derleme: Actions → "Masaüstü (Steam)" (masaustu.yml), girdiler sürüm ve Steam App ID → GitHub sürümü `masaustu-<sürüm>`: Windows zip, macOS zip (universal), Linux tar.gz + AppImage + deb (Pardus için deb)
- Steam görselleri: `node araclar/steam/gorseller.js` (kapsüller araclar/steam/kapak.html ile, ekran görüntüleri TR/EN 1920×1080) → store/steam/
- Mağaza metinleri TR/EN ve Steam metinleri: store/surum-1.5.md; App Store metinleri store/appstore-metadata/{tr,en-US}; İngilizce ekran görüntüleri store/en/
- Derlemeler (25 Ekim, ücretsiz eşiklerle yeniden): iOS 1.5.0 (13) yüklendi, App Store 1.5.0 sürümüne bağlandı (TR + en-US metin ve görseller, inceleme notu yazıldı). Android 10 (1.5.0) imzalı (`imza-anahtari/malazgirt-1.5.0-10-imzali.aab`), Play kapalı test (Alpha) taslak sürümüne yüklendi, TR/EN sürüm notları girildi. Play mağaza girişi TR güncellendi, en-US çevirisi eklendi. Masaüstü: GitHub sürümü `masaustu-1.5.0` (Linux paketi xvfb altında açıldı).
- Uygulama içi ürün: App Store Connect'te `com.anduv.malazgirt.tamsurum` oluşturuldu (Non-Consumable, 1,99 $, 175 ülke, TR/EN adlar). Eksik: inceleme ekran görüntüsü (Mac: Documents/Malazgirt-Akincilari/iap-inceleme-ekrani.png) ve Paid Apps Agreement. Play: satıcı (Google Payments) hesabı açılınca ürün oluşturulacak.
- Denge (bütün bölümleri oynayan botlar): ortalama oyuncu ilk denemede 1–100 %73, 751–1071 %46, 1072–1453 %45; iyi oyuncu 1072–1453 %65. Takılan bölümler yumuşatıldı.
- Önemli: mobil 1.5 yayına çıkmadan önce satın alma çalışır olmalı (100. bölümden sonra ödeme ekranı çıkıyor).
- Steam ücretsiz demo: ilk 100 bölüm. Aynı paket, masaustu.yml'de `demo: true` + `tam_app_id` ile derlenir (GitHub sürümü `masaustu-demo-<sürüm>`). 101. bölümde "Steam'de tam sürüm" ekranı tam oyunun mağaza sayfasını Steam arayüzünde açar; aynı bilgisayarda ilerleme tam sürüme geçer.
- Arayüz büyük masaüstü pencerelerinde 1,45× / 2× ölçeklenir (index.html @media)

## Sıradakiler
- Apple ve Google'ın inceleme yanıtlarını bekle.
- 12+ test kullanıcısının Gmail adresini "Hisar Testçileri" listesine ekle, 14 gün sonra üretim başvurusu.
