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

## Sıradakiler
- Apple ve Google'ın inceleme yanıtlarını bekle.
- 12+ test kullanıcısının Gmail adresini "Hisar Testçileri" listesine ekle, 14 gün sonra üretim başvurusu.
