# Malazgirt Akıncıları 1.6.3 — Türkçe yazı düzeltmesi (iOS)

## Ne oldu?
Nutuk Salonu'nun TestFlight denemesinde iPhone'da Türkçe "ı" harfinin boş göründüğü fark edildi ("Mayıs" → "May s"). Aynı tarama Malazgirt Akıncıları'nın telefon sürümünde de aynı hatayı buldu:
- Yazı dosyaları kendi `@font-face` tanımlarımızla yükleniyor. fontsource'ta "ı" (U+0131) **latin** dosyasında, ama latin dosyasının aralığı `U+0000-00FF,U+2000-206F` yazıldığı için ı latin-ext dosyasına yönleniyordu; orada bulunmadığı için iOS harfi boş çiziyordu. Chrome ve Quest eksik harfi başka yazıdan tamamladığı için masaüstünde ve VR'da görünmüyordu.
- ◀ ▶ işaretleri iOS'ta mavi emoji kutusu olarak çiziliyordu.

## Düzeltme
- `www/index.html` (ve araçlardaki görsel üretici sayfalar): latin/latin-ext aralıkları fontsource'un resmî aralıklarıyla değiştirildi.
- `www/js/vr.js`: ◀ ▶ işaretlerine metin biçimi seçicisi (U+FE0E).
- `araclar/turkce-yazi-kontrol.py` yayın öncesi kontrole eklendi: bu iki hata bir daha olursa derleme durur.

## Mağaza
- App Store 1.6.3: "Yenilikler" metni güncellendi (TR/EN, emojisiz). Derleme TestFlight'tan seçilip incelemeye gönderilir (son tık Emre'de).
- Google Play: aynı düzeltmeyle AAB derlenir, imza Emre'de.
- Quest: VR sürümü web'den yüklendiği için düzeltme (emreanduv.github.io/malazgirt/vr) yayına girdi.
