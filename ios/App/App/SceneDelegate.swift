import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = AnaViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

// MARK: Mr. Anduv! eşitleme (G84) başı
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
// MARK: Mr. Anduv! eşitleme (G84) sonu
