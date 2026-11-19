# Sürüm 2.1.0: akıncılar ve sipahiler yeni çizimde (dal `gorsel-1.7`)

Çizim Planı G1 (emreanduv-tamga-yolu `evren/CIZIM-PLANI.md`): akıncı, at ve sancak modelleri Tamga Yolu HD insan kiti düzeyine.
Oyun mantığı, bölümler, ölçüler ve çarpışma aynı; yalnız görünüm değişti. Malazgirt mağazada → bu dal main'e Emre'nin cihaz onayından sonra birleştirilir.

## Ne değişti
- **Akıncı** (`www/js/oyun.js` `akinciG`): kürk kenarlı ak keçe börk (takım renginde bağ, al püskül), yüz (göz akı, göz bebeği, kaş, burun, kulak, pala bıyık, keçi sakal, ağız), ense saçı; belde daralan, dize inen kaftan (etek kenarı, çapraz yaka, etek yarığı), kuşak ve toka, kılıç kını; sırtta kepenek ve sadak (al-ak tüylü oklar); eklemli kol ve bacak (omuz, dirsek, diz), bol şalvar, al-kahve çizme; sol elde kemik uçlu Türk yayı.
- **Sipahi ve at** (`atParts`, `sipahiParts`): yuvarlak gövde (göğüs, karın, sağrı), kavisli boyun, uzun baş (alın akıtması, kulak, göz, burun delikleri), sağa dökülen yele ve perçem, kuyruk; kol/kalça → diz → bilek → toynak; al çul altın kenarlı, eyer, üzengi, gem ve dizgin. Binici: kaftan, kepenek, sarıklı tolga (sorguç, ense zırhı), yüz, takım renginde altın kenarlı kalkan, flamalı mızrak.
- **Serdar sancağı**: gönderde düz, uçta dalgalanan al sancak; iki yüzünde ak hilal ve yıldız, altın saçak, alemde hilal.
- **Gök kubbesi**: ufukta sis rengi (yer siste kesintisiz erir), tepeye doğru bölgenin/havanın göğü; uzakta yavaş bulutlar (havaya göre renk), gece yıldızlar. VR'da gizli (VR'ın kendi odası var).
- **Kamera**: dik ekranda bakış hafif kalktı (bakış noktası 1,8 birim yukarı, görüş açısı 58 → 60): ufuk ve gök üst şeride girer, ordu yine ekranda. Yan ekran ve Sipahi Gözü aynı.
- **Işık**: gölge sivilcesine karşı `shadow.bias` / `normalBias` (yeni yuvarlak gövdeler için).
- **Performans**: akıncı ≈1450 üçgen (eskisi ≈250). Ayarlar → Grafik: Düşük eski sade gövdeleri kullanır; oyun sırasında 4 sn ortalama 36 kare/sn altına inerse ayrıntılı gövdeler o açılış için kendiliğinden sadeye iner (ayar değişmez).
- Önizleme: `araclar/model-onizleme.html?yon=on|arka|yan` (yerel sunucuyla).

## Denendi
390×844 ve 844×390: bölüm 4, 8, 721 (gece), 1071 (akşam), menü, dev; Sipahi Gözü gündüz ve gece; Grafik: Düşük; `?vrtest=1`; maç kipi. Sayfa hatası yok (maç kipindeki 'sfx' hatası main'de de var, deneme ortamından).

## Cihazda bakılacak
- Telefonda akıcılık (özellikle 200+ akıncılık ordu, gölgeler açık): takılırsa sade gövdeye iniyor mu.
- Quest'te (Harp Masası) kare hızı.
- Dik ekranda yeni bakış açısı oyunu zorlaştırıyor mu (ordu biraz daha aşağıda).

## Yenilikler (Google Play / App Store)
store/appstore-metadata/tr ve en-US `release_notes.txt` (500 karakterin altında, emoji yok).
