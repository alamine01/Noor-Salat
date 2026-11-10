import ExpoModulesCore
import Foundation
import SwiftUI
#if canImport(AlarmKit)
import ActivityKit
import AlarmKit
#endif

#if canImport(AlarmKit)
@available(iOS 26.0, *)
struct NoorAlarmMetadata: AlarmMetadata {}
#endif

/// Vrais réveils iPhone avec AlarmKit (iOS 26+) : ils sonnent en mode silencieux et avec Concentration,
/// en plein écran sur l'écran verrouillé, comme l'app Horloge.
public class NoorAlarmModule: Module {
  private let storeKey = "noor.alarm.ids"

  public func definition() -> ModuleDefinition {
    Name("NoorAlarm")

    Function("isSupported") { () -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) { return true }
      #endif
      return false
    }

    Function("authorizationStatus") { () -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        switch AlarmManager.shared.authorizationState {
        case .authorized: return "authorized"
        case .denied: return "denied"
        case .notDetermined: return "notDetermined"
        @unknown default: return "notDetermined"
        }
      }
      #endif
      return "unavailable"
    }

    AsyncFunction("requestAuthorization") { () async -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        do {
          let state = try await AlarmManager.shared.requestAuthorization()
          return state == .authorized
        } catch {
          return false
        }
      }
      #endif
      return false
    }

    /// Programme un réveil. `atMs` : date en millisecondes. `sound` : nom d'un fichier du paquet de l'appli (ex. « reveil.wav »).
    AsyncFunction("schedule") { (atMs: Double, title: String, buttonLabel: String, sound: String?) async -> String? in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        let id = UUID()
        let date = Date(timeIntervalSince1970: atMs / 1000)
        let stop = AlarmButton(text: LocalizedStringResource(stringLiteral: buttonLabel), textColor: .black, systemImageName: "sunrise.fill")
        let alert = AlarmPresentation.Alert(title: LocalizedStringResource(stringLiteral: title), stopButton: stop)
        let attributes = AlarmAttributes<NoorAlarmMetadata>(
          presentation: AlarmPresentation(alert: alert),
          metadata: NoorAlarmMetadata(),
          tintColor: Color(red: 226 / 255, green: 192 / 255, blue: 141 / 255)
        )
        let alertSound: AlertConfiguration.AlertSound = (sound?.isEmpty == false) ? .named(sound!) : .default
        let configuration = AlarmManager.AlarmConfiguration<NoorAlarmMetadata>(
          countdownDuration: nil,
          schedule: .fixed(date),
          attributes: attributes,
          stopIntent: nil,
          secondaryIntent: nil,
          sound: alertSound
        )
        do {
          _ = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
          var ids = UserDefaults.standard.stringArray(forKey: self.storeKey) ?? []
          ids.append(id.uuidString)
          UserDefaults.standard.set(ids, forKey: self.storeKey)
          return id.uuidString
        } catch {
          return nil
        }
      }
      #endif
      return nil
    }

    /// Annule tous les réveils programmés par Noor Salat.
    Function("cancelAll") { () -> Void in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        let ids = UserDefaults.standard.stringArray(forKey: self.storeKey) ?? []
        for s in ids {
          if let u = UUID(uuidString: s) { try? AlarmManager.shared.cancel(id: u) }
        }
        UserDefaults.standard.set([String](), forKey: self.storeKey)
      }
      #endif
    }

    /// Arrête un réveil en train de sonner (après le scan du tapis, par exemple).
    Function("stopAll") { () -> Void in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        let ids = UserDefaults.standard.stringArray(forKey: self.storeKey) ?? []
        for s in ids {
          if let u = UUID(uuidString: s) { try? AlarmManager.shared.stop(id: u) }
        }
      }
      #endif
    }
  }
}
