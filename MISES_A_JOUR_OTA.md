# Mises à jour sans passer par l'App Store / Play Store (OTA, EAS Update)

## Une seule fois
1. `npx expo install expo-updates`
2. Recompiler une fois (les versions installées doivent contenir expo-updates) :
   - iPhone : `npx eas-cli@latest build -p ios --profile production --auto-submit`
   - Android : `npx eas-cli@latest build -p android --profile preview`

## Ensuite, pour chaque correction
```powershell
cd C:\Users\lenovo\Desktop\noor-salat-main
$env:EAS_NO_VCS=1
npx eas-cli@latest update --channel production --environment production --message "ce qui a changé"
```
(`--channel preview` pour l'APK Android de test.)
Les téléphones téléchargent la mise à jour à l'ouverture de l'appli et l'appliquent à l'ouverture suivante.

## Ce qui passe en OTA
Écrans, textes, rappels, couleurs, logique en TypeScript, images et sons joués dans l'appli.

## Ce qui demande un nouveau build
Tout ce qui est natif : un module ajouté ou mis à jour (npm), le code Swift/Kotlin (modules/, targets/),
app.json (autorisations, plugins, icône, sons de notification), la version d'Expo.
La « runtime version » (empreinte du code natif) change alors toute seule : les anciennes versions
installées ne reçoivent pas une mise à jour incompatible.
