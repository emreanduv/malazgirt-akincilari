#!/usr/bin/env bash
# Yayın öncesi kontrol: mağazaya giden her derleme bundan geçer. Bir şey eksikse derleme DURUR.
# Neden: 8 Kasım 2026'da 1.6.1, 1.6 iyileştirmeleri olmayan eski bir daldan derlendi ve TestFlight'a gitti.
set -u
hata=0
dal="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}"
if [ "$dal" != "main" ]; then echo "::error::Mağaza derlemesi yalnız main dalından alınır (bu dal: $dal)"; hata=1; fi
# kapalı test geri bildirimleriyle gelen ve mağazadaki sürümde olan özellikler: biri eksikse derleme geri gitmiş demektir
kontrol() { if ! grep -q -- "$2" "$1"; then echo "::error::Eksik: $3 ($1 içinde '$2' yok)"; hata=1; else echo "✓ $3"; fi; }
kontrol www/index.html 'Bir Mr. Anduv! yapımıdır.' 'Ana ekranda imza'
kontrol www/index.html 'id="bHelp"' 'Nasıl Oynanır (ana menü)'
kontrol www/index.html 'id="bShare"' 'Arkadaşına öner'
kontrol www/index.html 'id="setRate"' 'Puan ver (Ayarlar)'
kontrol www/index.html 'id="setFeed"' 'Bize yaz (Ayarlar)'
kontrol www/index.html 'id="setErase"' 'Verilerimi sil (Ayarlar)'
kontrol www/index.html 'id="bFull"' 'Tam Sürüm düğmesi (Apple 2.1b)'
kontrol www/js/oyun.js 'function coachTick' 'Akıncı Rehberi (ipucu kartları)'
kontrol www/js/oyun.js 'InAppReview' 'Uygulama içi puan'
kontrol www/js/vr.js 'setFramebufferScaleFactor' 'VR performans ayarı (Meta VRC)'
kontrol package.json '@capacitor-community/in-app-review' 'In-App Review eklentisi'
kontrol package.json '@capacitor/share' 'Paylaş eklentisi'
# sürüm geri gidemez: istenen sürüm, depodaki son yayın sürümünden küçük olamaz
if [ -n "${SURUM:-}" ] && [ -f store/SON-SURUM ]; then
  son=$(cat store/SON-SURUM)
  if [ "$(printf '%s\n%s\n' "$son" "$SURUM" | sort -V | head -1)" != "$son" ]; then echo "::error::Sürüm geri gidiyor: $SURUM < $son"; hata=1; else echo "✓ Sürüm $SURUM ≥ $son"; fi
fi
# Türkçe yazı (iOS "ı") ve ◀ ▶ işaretleri — CLAUDE.md "Türkçe yazı ve iOS işaretleri"
if python3 araclar/turkce-yazi-kontrol.py; then :; else hata=1; fi
[ $hata -eq 0 ] && echo "Yayın kontrolü geçti." || { echo "Yayın kontrolü BAŞARISIZ — derleme durduruldu."; exit 1; }
