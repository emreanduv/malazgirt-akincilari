# Eşitleme (G84) kurulumu: kayıtlar iPhone, iPad ve Mac arasında kaldığı yerden devam eder.
# Ne yapar (tekrar çalıştırmak zararsızdır; eklenti bloğu her seferinde en güncel hâliyle yenilenir):
#   1. esitle.js'i web klasörüne koyar ve verilen sayfaların <head>'ine, bütün betiklerden önce ekler
#   2. iOS'a "Esitle" eklentisini (iCloud anahtar-değer deposu) ekler: SceneDelegate'li ya da storyboard'lu Capacitor
#   3. Yetki dosyası (App.entitlements) + project.pbxproj'da CODE_SIGN_ENTITLEMENTS
#   4. ios iş akışına "Eşitleme yetkisi arşive işlenir" adımını ekler (imzasız arşivde yetki kaybolmasın)
# Kullanım: python3 araclar/esitle_kur.py <uygulama kökü> [--js-dizin www] [--sayfa www/index.html ...] [--is .github/workflows/ios.yml ...] [--depo <repo kökü>] [--js-src esitle.js]
# App ID'de iCloud yeteneği açık olmalı (legend-heads asc-icloud.yml), yoksa dışa aktarım durur.
import os, re, sys, shutil, argparse
BURASI = os.path.dirname(os.path.abspath(__file__))
KAYNAK_JS = os.path.join(BURASI, '..', 'www', 'esitle.js')
BAS, SON = '// MARK: Mr. Anduv! eşitleme (G84) başı', '// MARK: Mr. Anduv! eşitleme (G84) sonu'
EKLENTI = BAS + '''
// Kayıtlar iCloud anahtar-değer deposunda, kullanıcının kendi Apple hesabında. JS tarafı: esitle.js.
// Sunucu yok; geliştirici hiçbir veriyi görmez.
import Capacitor
@objc(EsitlePlugin)
public class EsitlePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "EsitlePlugin"
    public let jsName = "Esitle"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "oku", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "yaz", returnType: CAPPluginReturnPromise)
    ]
    private let kv = NSUbiquitousKeyValueStore.default

    override public func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(disaridanDegisti(_:)),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification, object: kv)
        kv.synchronize()
    }

    @objc func disaridanDegisti(_ n: Notification) {
        let anahtarlar = (n.userInfo?[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String]) ?? []
        notifyListeners("degisti", data: ["anahtarlar": anahtarlar])
    }

    // Boş liste: depodaki bütün anahtarlar
    @objc func oku(_ call: CAPPluginCall) {
        kv.synchronize()
        var d: [String: Any] = [:]
        let liste = call.getArray("anahtarlar", String.self) ?? []
        if liste.isEmpty {
            for (k, v) in kv.dictionaryRepresentation { if let s = v as? String { d[k] = s } }
        } else {
            for k in liste { if let v = kv.string(forKey: k) { d[k] = v } }
        }
        call.resolve(["degerler": d, "icloud": FileManager.default.ubiquityIdentityToken != nil])
    }

    @objc func yaz(_ call: CAPPluginCall) {
        for (k, v) in call.getObject("degerler") ?? [:] { if let s = v as? String { kv.set(s, forKey: k) } }
        kv.synchronize()
        call.resolve()
    }
}

class AnaViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(EsitlePlugin())
    }
}
''' + SON + '\n'
YETKI = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.developer.ubiquity-kvstore-identifier</key>
	<string>$(TeamIdentifierPrefix)$(CFBundleIdentifier)</string>
</dict>
</plist>
'''
ADIM = '''      - name: Eşitleme yetkisi (iCloud anahtar-değer deposu) arşive işlenir
        run: |
          APP=$(ls -d $RUNNER_TEMP/*.xcarchive/Products/Applications/*.app | head -1)
          BID=$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP/Info.plist")
          cat > "$APP/archived-expanded-entitlements.xcent" <<X
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0"><dict>
            <key>application-identifier</key><string>${{ env.APPLE_TEAM_ID }}.$BID</string>
            <key>com.apple.developer.team-identifier</key><string>${{ env.APPLE_TEAM_ID }}</string>
            <key>com.apple.developer.ubiquity-kvstore-identifier</key><string>${{ env.APPLE_TEAM_ID }}.$BID</string>
          </dict></plist>
          X
          # Arşiv imzasız alındığı için yetkiler ikilide yok; dışa aktarım yetkileri mevcut imzadan okur.
          # Geçici (ad-hoc) imzayla yetkileri ikiliye koy; dışa aktarım asıl dağıtım imzasıyla yeniden imzalar.
          codesign -f -s - --entitlements "$APP/archived-expanded-entitlements.xcent" "$APP"
          codesign -d --entitlements - "$APP" 2>&1 | grep -i kvstore || true
'''

def oku(p): return open(p, encoding='utf-8').read()
def yaz(p, s): open(p, 'w', encoding='utf-8').write(s)

def swift(kok):
    app = os.path.join(kok, 'ios/App/App')
    sd, ad, sb = os.path.join(app, 'SceneDelegate.swift'), os.path.join(app, 'AppDelegate.swift'), os.path.join(app, 'Base.lproj/Main.storyboard')
    if os.path.exists(sd) and ('CAPBridgeViewController()' in oku(sd) or 'AnaViewController()' in oku(sd)):
        hedef = sd
        s = oku(sd).replace('window?.rootViewController = CAPBridgeViewController()', 'window?.rootViewController = AnaViewController()')
        assert 'AnaViewController()' in s, 'SceneDelegate beklenen biçimde değil'
    else:
        hedef = ad
        b = oku(sb)
        if 'customClass="AnaViewController"' not in b:
            b2 = b.replace('customClass="CAPBridgeViewController" customModule="Capacitor"', 'customClass="AnaViewController" customModule="App" customModuleProvider="target"')
            assert b2 != b, 'Main.storyboard beklenen biçimde değil'
            yaz(sb, b2)
        s = oku(ad)
    # Eski (işaretsiz) pilot bloğunu ve önceki işaretli bloğu çıkar, en güncelini ekle
    s = re.sub(re.escape(BAS) + r'.*?' + re.escape(SON) + r'\n?', '', s, flags=re.S)
    s = re.sub(r'\n// MARK: Mr\. Anduv! eşitleme \(G84\): kayıtlar.*?\nclass AnaViewController: CAPBridgeViewController \{.*?\n\}\n', '\n', s, flags=re.S)
    yaz(hedef, s.rstrip() + '\n\n' + EKLENTI)
    ent = os.path.join(app, 'App.entitlements')
    if not os.path.exists(ent): yaz(ent, YETKI)
    pbx = os.path.join(kok, 'ios/App/App.xcodeproj/project.pbxproj')
    p = oku(pbx)
    if 'CODE_SIGN_ENTITLEMENTS' not in p:
        p, n = re.subn(r'(\n(\t+)PRODUCT_BUNDLE_IDENTIFIER = [^;]+;)', r'\1\n\2CODE_SIGN_ENTITLEMENTS = App/App.entitlements;', p)
        assert n >= 2, n
        yaz(pbx, p)
    return os.path.relpath(hedef, kok)

def sayfa(p, js_yolu):
    s = oku(p)
    if re.search(r'<script[^>]+esitle\.js', s): return False
    etiket = '<script src="%s"></script>' % js_yolu
    m = re.search(r'<meta charset[^>]*>', s, re.I) or re.search(r'<head[^>]*>', s, re.I)
    assert m, p
    yaz(p, s[:m.end()] + etiket + s[m.end():])
    return True

def is_akisi(p):
    s = oku(p)
    if 'Eşitleme yetkisi' in s: return False
    i = s.index("      - name: App Store Connect'e yükle")
    yaz(p, s[:i] + ADIM + s[i:])
    return True

if __name__ == '__main__':
    a = argparse.ArgumentParser()
    a.add_argument('kok'); a.add_argument('--js-dizin', default='www')
    a.add_argument('--sayfa', nargs='*', default=None); a.add_argument('--is', dest='isler', nargs='*', default=None)
    a.add_argument('--depo', default=None); a.add_argument('--js-src', default=None, help='sayfadaki yol (vite public/ için: esitle.js)')
    o = a.parse_args()
    kok, depo = os.path.abspath(o.kok), os.path.abspath(o.depo or o.kok)
    jd = os.path.join(kok, o.js_dizin); os.makedirs(jd, exist_ok=True)
    if os.path.abspath(KAYNAK_JS) != os.path.abspath(os.path.join(jd, 'esitle.js')): shutil.copy(KAYNAK_JS, os.path.join(jd, 'esitle.js'))
    for p in (o.sayfa if o.sayfa is not None else [os.path.join(o.js_dizin, 'index.html')]):
        pp = os.path.join(kok, p)
        derin = os.path.relpath(jd, os.path.dirname(pp)).replace(os.sep, '/')
        js = o.js_src or ('esitle.js' if derin == '.' else derin + '/esitle.js')
        print(' sayfa', p, 'eklendi' if sayfa(pp, js) else 'zaten var')
    print(' swift', swift(kok))
    for p in o.isler or ['.github/workflows/ios.yml']:
        print(' iş akışı', p, 'eklendi' if is_akisi(os.path.join(depo, p)) else 'zaten var')
    print('eşitleme kuruldu:', kok)
