#!/usr/bin/env python3
"""Meta Quest (Horizon Store) sürümünü emreanduv.github.io deposuna (mevcut vitrin sitesi) ekler.
Kullanım: python3 araclar/quest-site.py <emreanduv.github.io-klonu> <SHA256-parmak-izi>
Vitrine, /malazgirt/ gizlilik sayfasına ve diğer oyunlara dokunmaz; yalnızca şunları yazar:
- /malazgirt/vr/       oyun (www kopyası; QUEST_SURUM=1: ilk 100 bölüm ücretsiz, Tam Sürüm Meta üzerinden)
- /malazgirt/vr/manifest.webmanifest, ikonlar
- /.well-known/assetlinks.json  (Quest uygulamasının bu siteyi tam ekran açabilmesi için)
"""
import json, os, shutil, sys
from PIL import Image

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import subprocess
if subprocess.call(['bash', os.path.join(KOK, 'araclar/yayin-kontrol.sh')], cwd=KOK) != 0: sys.exit('Yayın kontrolü geçmedi: Quest sitesi güncellenmedi.')
out, sha = sys.argv[1], sys.argv[2]
PAKET = 'com.anduv.malazgirt.vr'

oyun = os.path.join(out, 'malazgirt', 'vr')
if os.path.exists(oyun): shutil.rmtree(oyun)
shutil.copytree(os.path.join(KOK, 'www'), oyun)

ik = Image.open(os.path.join(KOK, 'store/play-icon-512.png')).convert('RGB')
for n in (192, 512): ik.resize((n, n), Image.LANCZOS).save(os.path.join(oyun, f'ikon-{n}.png'))

man = {
  'name': 'Malazgirt Akıncıları', 'short_name': 'Malazgirt', 'lang': 'tr',
  'description': "Akıncılarını büyüt, kapıyı seç: Malazgirt'ten Fetih Yolu'na 1453 bölüm. Harp masasında VR.",
  'start_url': 'index.html?vr=1', 'scope': './', 'display': 'standalone', 'orientation': 'landscape',
  'background_color': '#081224', 'theme_color': '#12305a',
  'icons': [{'src': 'ikon-192.png', 'sizes': '192x192', 'type': 'image/png'},
            {'src': 'ikon-512.png', 'sizes': '512x512', 'type': 'image/png'},
            {'src': 'ikon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]
}
json.dump(man, open(os.path.join(oyun, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

p = os.path.join(oyun, 'index.html'); h = open(p, encoding='utf-8').read()
ek = '<script>window.QUEST_SURUM=1</script><link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#12305a">'
assert '<head>' in h and 'QUEST_SURUM' not in h
h = h.replace('<head>', '<head>' + ek, 1)
open(p, 'w', encoding='utf-8').write(h)

wk = os.path.join(out, '.well-known'); os.makedirs(wk, exist_ok=True)
json.dump([{'relation': ['delegate_permission/common.handle_all_urls'],
            'target': {'namespace': 'android_app', 'package_name': PAKET, 'sha256_cert_fingerprints': [sha]}}],
          open(os.path.join(wk, 'assetlinks.json'), 'w'), indent=1)
open(os.path.join(out, '.nojekyll'), 'a').close()
print('hazır:', oyun)
