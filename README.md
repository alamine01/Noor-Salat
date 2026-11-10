# NOOR SALAT · نور الصلاة

« Ta prière, ta lumière, ton rappel » — appli React Native + Expo (SDK 58).

## Lancer

```bash
export PATH=~/.local/node/bin:$PATH
npx expo start --web          # aperçu dans le navigateur (sans blocage ni caméra)
```

## Construire l'APK Android de test

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH=~/.local/node/bin:$JAVA_HOME/bin:$PATH
npx expo prebuild --platform android --no-install
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
# → android/app/build/outputs/apk/release/app-release.apk
```

## Où est quoi

- `src/app/` : les écrans (accueil `index`, `block`, `scan`, `fajr`, `fajr-ring`, `profile`)
- `src/lib/` : heures de prière (Aladhan), streak / % Noor, Firebase, alarmes, sons
- `modules/noor-blocker/` : code Android natif (Kotlin) du blocage : statistiques d'usage, superposition, alarmes exactes, service « gardien »
- `assets/sounds/` : `ding.wav`, `woosh.wav`, `alarme_temporaire.wav` (à remplacer par tes audios)
- `.env.example` : les clés Firebase à remplir (copier en `.env`)
