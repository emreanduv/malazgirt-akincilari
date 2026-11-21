# Eşitleme (G84) kurulumu: iOS'a "Esitle" eklentisi (iCloud anahtar-değer deposu) + yetki dosyası.
# Kullanım (repo kökünde): python3 araclar/esitle_kur.py   · Tekrar çalıştırmak zararsızdır.
import os, re
SD = 'ios/App/App/SceneDelegate.swift'
ENT = 'ios/App/App/App.entitlements'
PBX = 'ios/App/App.xcodeproj/project.pbxproj'
EKLENTI = '''
// MARK: Mr. Anduv! eşitleme (G84): kayıtlar iCloud anahtar-değer deposunda, kullanıcının kendi Apple hesabında.
// JS tarafı: www/esitle.js. Sunucu yok; geliştirici hiçbir veriyi görmez.
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

    @objc func oku(_ call: CAPPluginCall) {
        kv.synchronize()
        var d: [String: Any] = [:]
        for k in call.getArray("anahtarlar", String.self) ?? [] { if let v = kv.string(forKey: k) { d[k] = v } }
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
'''
s = open(SD).read()
if 'EsitlePlugin' not in s:
    assert 'window?.rootViewController = CAPBridgeViewController()' in s, 'SceneDelegate beklenen biçimde değil'
    s = s.replace('window?.rootViewController = CAPBridgeViewController()', 'window?.rootViewController = AnaViewController()')
    s = s.rstrip() + '\n' + EKLENTI
    open(SD, 'w').write(s)
if not os.path.exists(ENT):
    open(ENT, 'w').write('''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.developer.ubiquity-kvstore-identifier</key>
	<string>$(TeamIdentifierPrefix)$(CFBundleIdentifier)</string>
</dict>
</plist>
''')
p = open(PBX).read()
if 'CODE_SIGN_ENTITLEMENTS' not in p:
    p, n = re.subn(r'(\n(\t+)PRODUCT_BUNDLE_IDENTIFIER = [^;]+;)', r'\1\n\2CODE_SIGN_ENTITLEMENTS = App/App.entitlements;', p)
    assert n >= 2, n
    open(PBX, 'w').write(p)
print('eşitleme kuruldu')
