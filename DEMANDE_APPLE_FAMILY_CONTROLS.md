# Demande d'autorisation « Family Controls (Distribution) » à Apple

Formulaire : https://developer.apple.com/contact/request/family-controls-distribution
(connecte-toi avec ton compte Apple Developer).

**Une seule demande suffit** : le formulaire ne demande que le nom, l'e-mail et le Team ID. L'autorisation est donnée à tout le compte développeur.
Demande envoyée le 8 novembre 2026, Request ID **7PW972JACC**.

Garde le texte ci-dessous pour répondre si Apple pose des questions.

## Texte à coller (en anglais, Apple répond en anglais)

**App name:** Noor Salat

**Describe how your app uses the Family Controls API:**

Noor Salat is a free prayer companion app for Muslims. It helps users keep their five daily prayers on time by letting them voluntarily pause distracting apps during prayer time.

The user authorizes Screen Time for their own device (individual authorization, AuthorizationCenter with `.individual`). They choose, with Apple's FamilyActivityPicker, which apps or categories they want paused. Five minutes after each prayer time, a DeviceActivity schedule applies a ManagedSettings shield to the selected apps for up to 60 minutes. The shield is lifted as soon as the user confirms the prayer in the app (by scanning a personal QR code placed on their prayer mat), or automatically at the end of the interval. Phone calls and emergency features are never restricted.

The same selection is also used for an optional "Focus" session that the user starts themselves, and for an optional morning (Fajr) wake-up session. The app can also enable Apple's built-in adult web content filter (WebContentSettings) at the user's request.

We do not collect, read or transmit any Screen Time data: application tokens stay on the device, are never sent to our servers, and are only used to apply the shields the user asked for. The app is not used to monitor or control another person's device.

**Target audience:** adults and teenagers managing their own device (self-discipline / digital wellbeing).

## Après l'accord d'Apple

1. Sur developer.apple.com › Certificates, Identifiers & Profiles › Identifiers : pour chacun des 4 identifiants, coche « Family Controls (Distribution) » dans *Additional Capabilities*, et « App Groups » avec `group.com.noorsalat.app`.
2. Mets ton **Team ID** dans `app.json` (`expo.ios.appleTeamId`).
3. `npx eas build --platform ios --profile preview` (EAS gère les certificats et les profils des 4 cibles).

Tant que l'accord n'est pas là, tu peux tester seulement avec Xcode sur ton propre iPhone (signature « Development »), pas avec EAS ni TestFlight.
