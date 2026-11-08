# Sürüm 2.0.0: 1923 bölüm, 40 sefer (son sürüm)

1453. bölümden (Fetih Yolu) sonra 470 yeni bölüm: 1911–1923 arası dokuz sefer ve 1923. bölümde biten 20 bölümlük büyük final. Oyun artık tamam: son bölümden sonra "Pek yakında" sayfası yok, sefer haritası 40. seferde biter.

| Sefer | Yıl | Bölümler | Bölgeler | Sefer sonu devi |
|---|---|---|---|---|
| 31. Trablusgarp | 1911–1912 | 1454–1503 | Trablus Kıyısı, Bingazi, Derne, Çöl Yolları, Tobruk | İtalyan Başkomutanı |
| 32. Edirne | 1912–1913 | 1504–1553 | Çatalca Hattı, Edirne Savunması, Trakya Yolu, Meriç Boyu, Edirne | Edirne Garnizon Komutanı |
| 33. Çanakkale | 1915 | 1554–1603 | 18 Mart, Seddülbahir, Arıburnu, Conkbayırı, Anafartalar | İtilaf Başkomutanı |
| 34. Kut'ül Amare | 1915–1916 | 1604–1653 | Basra Yolu, Selman-ı Pak, Kut Kuşatması, Kurtarma Kolları, Kut'ül Amare | Kut Garnizon Komutanı |
| 35. Doğu Cephesi | 1920 | 1654–1703 | Erzurum, Sarıkamış, Kars Yolu, Kars, Gümrü | Gümrü Garnizon Komutanı |
| 36. İnönü | 1921 | 1704–1753 | Bursa'dan Doğuya, Birinci İnönü, Eskişehir Yaylası, Dumlupınar Yolu, İkinci İnönü | Yunan Kolordu Komutanı |
| 37. Sakarya | 1921 | 1754–1803 | Sakarya'nın Doğusu, Başkomutan, Mangaldağı, Duatepe, Sakarya | Yunan Ordu Komutanı |
| 38. Büyük Taarruz | 1922 | 1804–1853 | Gizli Yürüyüş, Kocatepe, Afyon, Dumlupınar, Uşak | Yunan Ordusu Karargâhı |
| 39. İzmir Yolu | 1922 | 1854–1903 | Akdeniz'e, Gediz Boyu, Manisa, Nif ve Belkahve, İzmir | Yunan Artçı Komutanı |
| 40. 1923 | 1923 | 1904–1923 | Cepheler, Ankara | Bütün Cephelerin Orduları |

- 11 yeni birlik: İtalyan piyadesi ve süvarisi, Bulgar piyadesi, İngiliz, Anzak ve Hint piyadesi, Hint süvarisi, dağ piyadesi, evzon, Yunan süvarisi, makineli tüfekçi (yerinden kıpırdamayan atıcı; tabyalarda da tüfekçinin yerini alır)
- 23 yeni dev, 3 yeni yay (Çanakkale, Sakarya, Kocatepe; 33., 37. ve 38. seferde açılır)
- Engel ağırlıkları seferin konusuna göre (mantik.js `MECH_BIAS`): Çanakkale'de top gülleleri, hendekler ve sur; Doğu Cephesi'nde dar geçitler; Trablusgarp'ta kervanlar
- Görsel: çöl, Gelibolu kıyıları ve kayalıkları, Mezopotamya, karlı doğu (hep kar), Anadolu bozkırı, Ege; Kocatepe şafakta, Gizli Yürüyüş gece, 1923. bölüm akşam
- 1453. bölüm aynen kaldı (dev canı ×2, şafak). 1–1453 arası bölümler bayt bayt aynı (bölüm üretimi, CAL katsayıları)
- Steam başarımları: SEFER_31 … SEFER_40 (store/steam/basarimlar.json; Steamworks'e de eklenmeli)

## Denge
Bütün 1923 bölümü sırayla oynayan botlar (araclar/denge-testi.js), takılan bölüm yok:

| | 1072–1453 | 1454–1923 |
|---|---|---|
| İyi oyuncu, ilk denemede kazanma | %61 | %56 |
| Ortalama oyuncu, ilk denemede kazanma | %48 | %43 |
| Ortalama oyuncu, en çok deneme | 22 | 21 |

Sefer sefer (ortalama oyuncu): Trablusgarp %42, Edirne %44, Çanakkale %46, Kut %38, Doğu %46, İnönü %56, Sakarya %44, Büyük Taarruz %34, İzmir Yolu %46, 1923 finali %20.

## Yenilikler (Google Play / App Store, en fazla 500)

Metinler: store/appstore-metadata/tr/release_notes.txt ve en-US/release_notes.txt (ikisi de 500 karakterin altında, emoji yok).
