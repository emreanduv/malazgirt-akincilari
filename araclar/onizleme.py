#!/usr/bin/env python3
"""www/ klasöründeki oyunu tek dosyalık bir web önizlemesine çevirir (Claude artifact için).
three.js CDN'den, yazı tipi Google Fonts'tan gelir; mantik.js ve oyun.js gömülür.
Kullanım: python3 araclar/onizleme.py <çıktı.html>"""
import sys, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'www'
html = (root / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>', '', html, flags=re.I)
html = re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>', '', html)
html = html.replace('</head>', '').replace('<body>', '').replace('</body>', '').replace('</html>', '')
html = re.sub(r'@font-face\{[^}]*\}\s*', '', html)
html = html.replace('<style>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap">\n<style>', 1)
html = html.replace('<script src="lib/three.min.js"></script>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
for name in ['mantik', 'oyun']:
    js = (root / 'js' / f'{name}.js').read_text(encoding='utf-8')
    html = html.replace(f'<script src="js/{name}.js"></script>', '<script>\n' + js + '\n</script>')
pathlib.Path(sys.argv[1]).write_text(html.strip() + '\n', encoding='utf-8')
print('yazıldı:', sys.argv[1], len(html) // 1024, 'KB')
