# Malazgirt Akıncıları

1071 temalı dikey "kalabalık koşucusu" (crowd runner). Akıncılarını kapılardan geçirerek büyüt, kaideleri okla, Bizans ordusunu dağıt. 50 bölüm, 5 bölge, her bölüm bir öncekinden biraz daha zor. Reklamsız, internetsiz, veri toplamaz.

## Klasörler
- `www/` → Oyunun kendisi (internetsiz çalışır)
  - `index.html` → ekranlar ve görünüm
  - `js/mantik.js` → oyun kuralları, 50 bölümün üretimi, zorluk katsayıları (çizimden bağımsız)
  - `js/oyun.js` → 3D çizim (three.js), ses, menüler, kayıt
  - `lib/three.min.js` (MIT), `fonts/` Baloo 2 (SIL OFL)
- `android/` → Android Studio projesi (Capacitor, paket `com.anduv.malazgirt`, dikey kilitli)
- `ios/` → Xcode projesi (Capacitor, dikey kilitli)
- `assets/` → İkon 1024, Android ön plan ikonu, açılış ekranı, Google Play öne çıkan görsel
- `store/` → Mağaza metinleri (TR/EN), form cevapları, gizlilik politikası, ekran görüntüleri
- `araclar/` → Denge testi, zorluk kalibrasyonu, mağaza görseli üretici, web önizleme
- `.github/workflows/` → Hisar'daki gibi: iOS'u App Store Connect'e (TestFlight) yükler, Android `.aab` paketini üretir

## Bilgisayarda deneme
```
npm install
npm run serve        # http://localhost:8765/www/
```

## Oyunu değiştirince
`www/` içinde düzenle, sonra `npx cap sync`. GitHub'a gönderince iş akışlarını Actions sekmesinden elle başlat.

## Zorluk ayarı
- `js/mantik.js` → `UPG` (Ordugâh fiyatları), `FOES` (düşmanlar), `WEAPONS` (yaylar), `buildLevel` (bölüm üretimi)
- `CAL` dizisi her bölümün zorluk katsayısıdır. Elle değil `npm run kalibre` ile üretilir: 7 farklı "hata yapan oyuncu" botu her bölümü oynar, çoğunun kaybettiği eşik bulunur ve bölüm bu eşiğin %50'sinden (Bölüm 1) %88'ine (Bölüm 50) yerleştirilir.
- `npm run denge` → tek bir bot 50 bölümü baştan sona oynar, kaç denemede geçtiğini ve aldığı yıldızı yazar.

## Mağazaya çıkış (Hisar ile aynı yol)
- **iOS:** GitHub → Actions → "iOS (App Store Connect / TestFlight)" → Run workflow. Depoda `ASC_KEY_P8` secret'ı olmalı (Hisar'daki Apple anahtarının aynısı). App Store Connect'te önce Bundle ID `com.anduv.malazgirt` ile uygulama kaydı açılmalı.
- **Android:** Actions → "Android (Google Play paketi)" → Run workflow → çıkan `.aab` `builds` dalına ve Artifacts'a konur. İmzalama Hisar'da nasıl yaptıysan aynı.
- Formlar: `store/form-cevaplari.md`, metinler: `store/magaza-metinleri.md`.
