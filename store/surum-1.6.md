# Sürüm 1.6.0: Akıncı Rehberi, puan ver, paylaş, görüş bildir

Kaynak: Testers Community kapalı test raporu (Kasım 2026). Raporda çökme ya da hata çıkmadı; dört iyileştirme önerildi, dördü de bu sürümde var.

| Öneri | 1.6'da ne yapıldı |
|---|---|
| Yeni oyuncuya dinamik rehber | **Akıncı Rehberi:** her yeni öğe (kapı, blok, düşman birliği, kaide, dev, barikat, kervan, mancınık taşı, dar geçit, hendek, sur, top güllesi, Sipahi Gözü) ilk kez yaklaştığında üstte kısa bir kart çıkar, oyun bir an ağır çekime geçer. İlk bölümde "kaydır" ipucu, oyuncu gerçekten kaydırana kadar ekranda kalır (oyuncunun hızına uyar). Eski oyunculara bildikleri temel ipuçları gösterilmez. |
| Yardım düğmesi | Ana menüde, molada ve Ayarlar'da **Nasıl Oynanır** ekranı: 19 ipucunun hepsi, henüz görülmeyenler altın çerçeveli. "Rehberi baştan göster" düğmesi. |
| Uygulama içinden puan | Google Play In-App Review (iOS'ta SKStoreReview). 7., 25. ve 60. bölüm ilk kez geçilince nazik bir soru: "Puan ver / Önerim var / Sonra". En çok iki kez sorulur, yenilgide hiç sorulmaz. Ayarlar'da her zaman "★ Puan ver". |
| Paylaş | Ana menüde ve Ayarlar'da **Arkadaşına öner**; zafer ekranında **Zaferi paylaş** ("… bölümü 3 yıldızla geçtim!"). Android/iOS paylaşım menüsü. |
| Görüş kanalı (ek öneri) | Ayarlar → **Görüş ve öneri → Bize yaz**: sürüm, platform ve bölüm bilgisiyle hazır e-posta. |
| ASO | Aşağıda yeni kısa ve uzun açıklama. |

Teknik: `@capacitor-community/in-app-review` 8.0.0 ve `@capacitor/share` 8.0.3 eklendi. Oyun yine veri toplamıyor (puan ve paylaşım mağazanın/telefonun kendi ekranlarıyla yapılır), Veri Güvenliği formu değişmez.

---

## Yenilikler (Google Play / App Store, en fazla 500)

**TR**
Akıncı Rehberi geldi!
• Yeni bir engelle ilk karşılaştığında kısa bir ipucu kartı çıkar: kapılar, kaideler, devler, kervanlar, mancınık taşları, top gülleleri…
• Ana menüde ve molada "Nasıl Oynanır" ekranı
• Zaferini arkadaşlarınla paylaş
• Oyunu uygulamadan çıkmadan puanla
• Ayarlar'dan bize doğrudan yaz
Test ekibimize teşekkürler!

**EN**
Meet the Raider's Guide!
• A short tip card appears the first time you meet something new: gates, pedestals, giants, caravans, catapult stones, cannonballs…
• "How to Play" screen in the main menu and pause menu
• Share your victories with friends
• Rate the game without leaving it
• Write to us straight from Settings
Thanks to our testers!

---

## ASO: Google Play mağaza metni (öneri)

Test raporunun ASO notu: açıklamanın ilk satırları arama için en değerli yer. Google Play'de ayrı anahtar kelime alanı yok; kelimeleri kısa açıklama ve uzun açıklamanın ilk 2-3 satırı taşır.

### Kısa açıklama (en fazla 80)
TR: Okçu ordunu büyüt, kapıyı seç! Malazgirt'ten İstanbul'un Fethi'ne 1453 bölüm
EN: Grow your archer army, pick the right gate! 1453 levels of Ottoman history

### Uzun açıklama: yeni ilk paragraf (1.5 metninin başına gelir, gerisi aynı)
TR:
Malazgirt Akıncıları, tarih severler için bir ordu büyütme ve strateji oyunu. Selçuklu ve Osmanlı tarihinin büyük seferlerinde akıncılarını yönet: Malazgirt Meydan Muharebesi (1071), Miryokefalon, Kosova, Varna, İstanbul'un Fethi (1453), Mohaç, Plevne… Parmağını kaydır, doğru kapıyı seç, okçu ordunu binlere büyüt ve Bizans'tan Haçlılara kadar her orduyu dağıt. Reklamsız, internetsiz oynanır; ilk 100 bölüm ücretsiz.

EN:
Malazgirt Akıncıları is an army-growing strategy game for history lovers. Lead your raiders through the great campaigns of Seljuk and Ottoman history: the Battle of Manzikert (1071), Myriokephalon, Kosovo, Varna, the Conquest of Constantinople (1453), Mohács, Plevna… Swipe, pick the right gate, grow your archer army into the thousands and scatter every army from Byzantium to the Crusaders. No ads, plays offline, first 100 levels free.

### Uzun açıklamaya eklenecek madde
TR: • Akıncı Rehberi: yeni oyunculara adım adım ipuçları, her an açılabilen "Nasıl Oynanır" ekranı
EN: • Raider's Guide: step-by-step tips for new players and a "How to Play" screen any time

### App Store anahtar kelimeleri (değişmedi, 100 karakter)
malazgirt,alparslan,akıncı,fetih,istanbul,plevne,mohaç,belgrad,prut,osmanlı,selçuklu,tarih

---

## Google Play üretim erişimi başvurusu: cevaplar (kapalı test bitince, ~10 Kasım)

Testers Community'nin hazır cevapları genel kalıp; Google aynı kalıbı yüzlerce başvuruda görüyor. Aşağıdakiler bizim gerçek sürecimiz. İngilizce yazılır.

**1. How did you recruit users for your closed test?**
We combined a paid testing provider (Testers Community, 12+ testers on a 14-day programme) with people we know: family members and friends who play mobile games, each testing on their own Android phone.

**2. How easy was it to recruit testers?** Neither easy nor difficult (or: Easy)

**3. Describe the engagement you received from testers.**
Testers played the game on a range of Android devices and OS versions over 14 days and kept it installed for the whole period. They played through the early campaigns, tried the settings (language, sound, graphics quality, view mode) and the Full Version paywall, and sent us a written report. Friends and family also gave direct feedback by message while playing.

**4. Summary of the feedback and how you collected it.**
Feedback came from the testing provider's written report (device/SDK test results plus UX recommendations) and from direct messages. No crashes or functional bugs were found on any device. The main suggestions were: an interactive tutorial for new players and a help button, a better store description for discoverability (ASO), an in-app "rate the app" option, and a "share the app" option.

**5. Who is the intended audience?**
Players aged 13+ who enjoy short casual arcade/strategy sessions, especially people interested in Seljuk and Ottoman history. The game is in Turkish and English.

**6. How does your app provide value to users?**
It is a quick, satisfying army-runner where each 30-90 second level is a moment from Seljuk and Ottoman history, from Manzikert 1071 to the Conquest of Constantinople and beyond. It has no ads, works offline, collects no data, and the first 100 levels are free.

**7. Expected installs in the first year:** 10K – 100K (ya da daha temkinli: 1K – 10K)

**8. What changes did you make based on what you learned?**
Version 1.6.0 adds: (1) the "Raider's Guide", a progressive tutorial that shows a short tip card the first time the player meets each new element (gates, blocks, enemy units, pedestals, giants, caravans, catapult stones, cannonballs, etc.) and briefly slows the game so the player can read it; the first swipe hint stays until the player has actually swiped; (2) a "How to Play" help screen reachable from the main menu, the pause menu and Settings; (3) Google Play In-App Review, offered politely after milestone levels and always available in Settings; (4) "Tell a friend" and "Share your victory" options using the Android share sheet; (5) an in-app feedback option; (6) an improved, keyword-rich store description.

**9. How did you decide the app is ready for production?**
The 14-day closed test showed no crashes or bugs across devices and SDK levels, the in-app purchase and restore flow worked, and we addressed every recommendation from testers in version 1.6.0, which we verified on our own Android devices before release.

**10. What did you do differently this time?** (soru çıkarsa)
We tested with a larger and more varied group of devices, collected structured written feedback instead of informal comments, and added onboarding and in-app feedback channels so we keep learning from players after launch.
