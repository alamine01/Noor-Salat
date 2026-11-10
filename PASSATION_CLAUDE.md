# Reprise du projet Noor Salat

Tu reprends le développement de **Noor Salat**, une appli musulmane de prière 100 % gratuite (public sénégalais et francophone), pour Android et iPhone. Je parle français, réponds en français. Le projet est sur mon PC : `C:\Users\lenovo\Desktop\noor-salat-main` (lis d'abord `RAPPORT.md`, `MISES_A_JOUR_OTA.md`, `TEST_ANDROID.md`).

## Stack
- Expo SDK 58, React Native 0.88, expo-router (`src/app`), TypeScript.
- Design « Nuit profonde + or » : fond #07090F, or #E2C08D / #F3D9A4, titres Instrument Serif, texte Inter, arabe Amiri. Jetons dans `src/lib/theme.ts`, composants animés dans `src/components/ui.tsx`.
- Maquette de référence (canvas Claude Design) : « Noor Salat — Maquette », avec une rangée « Premier lancement · onboarding » (13 écrans).
- Firebase (projet noor-salat-d50c8) : connexion anonyme puis e-mail, Firestore `users/{uid}`, `users/{uid}/jours/{date}`, `classement/{uid}`. Les clés sont dans `.env` (EXPO_PUBLIC_FIREBASE_*), règles dans `firestore.rules`.
- EAS : compte Expo `al_amine`, projet `@al_amine/noor-salat` (id 9841a7c9-9449-4265-854c-45d0eb0e9294). Le dossier n'est pas un dépôt git, donc il faut toujours `$env:EAS_NO_VCS=1`.
  - Profils : `preview` (APK Android), `production` (iOS TestFlight).
  - EAS Update configuré (runtimeVersion par empreinte, canaux preview / production, expo-updates installé).
- Apple : Team ID XS2D9CT49Q, bundle `com.noorsalat.app` + extensions `.ShieldConfiguration`, `.ShieldAction`, `.ActivityMonitorExtension`, groupe `group.com.noorsalat.app`. Family Controls (Distribution) **accordé** et activé sur les 4 identifiants.

## Fonctionnement
- **Heures de prière** : API Aladhan (méthode 3, Dakar), cache par jour.
- **Rappels** (`src/lib/blocker.ts` + `src/lib/messages.ts`) : 10 min avant, à l'heure, +15 min, +30 min, programmés 7 jours d'avance. iPhone : 60 au maximum, les plus importants d'abord. Style Complet ou Essentiel. Les rappels de suivi sont annulés quand la prière est validée.
- **Blocage Android** : module natif `modules/noor-blocker` (Kotlin) avec service de premier plan, alarmes exactes, redémarrage, sonnerie native du Fajr.
- **Blocage iPhone** : `react-native-device-activity` (Temps d'écran), dans `src/lib/ios.ts` et `src/components/IosBlocking.tsx` (choix des applis dans la liste d'Apple, diagnostic du blocage).
  - Écran Apple personnalisé dans `targets/ShieldConfiguration`, avec un rappel tiré au hasard (`src/lib/rappels.ts`).
  - Max 20 activités, donc 3 jours d'avance.
- **Réveil iPhone** : module maison `modules/noor-alarm` (Swift, AlarmKit, iOS 26) pour le Fajr et le Tahajjud. La bibliothèque react-native-ios-alarmkit a été retirée : incompatible avec Nitro.
- **Sons** (`assets/sounds`) : « As-salātu khayrun mina-n-nawm » (khayr), adhan du Fajr (Besim Azemi, CC BY 3.0), adhan « Beautiful » (CC0), avec versions de 30 s pour les notifications iPhone. Crédits dans Réglages.
- **Écran de blocage Android** (`src/app/block.tsx`) : rappel aléatoire différent à chaque ouverture, scan du QR du tapis, 5 versets, appel d'urgence.
- **Onboarding** (`src/components/Onboarding.tsx`, branché dans `src/app/_layout.tsx`) : 13 écrans, affichés seulement au premier lancement. Les autorisations sont demandées à l'écran dédié. Les réponses règlent le réveil, le blocage, les rappels et le Tahajjud.
- **Squats du Fajr** (`src/lib/squats.ts`), **Tahajjud**, **Focus**, **Noor Filter** (DNS Android, filtre web Apple), **Coran**, **Dhikr**, **Qibla**, **compte et classement**.

## Où on en est
1. Une version iPhone est sur TestFlight. Le blocage iPhone ne marchait pas : le choix des applis semblait vide. Correction faite (attente avant de relire le choix), plus un écran « Diagnostic du blocage » dans Réglages. **À vérifier sur l'iPhone** (iOS 26.7.2).
2. La mise à jour OTA (onboarding + correction) a échoué parce que le **disque C: était plein**. Lancer `liberer_place.ps1` sur le Bureau, puis :
   `npx eas-cli@latest update --channel production --environment production --platform ios --message "..."`
3. Le build Android `preview` (APK) n'est pas encore testé sur un téléphone. Le premier avait échoué à cause d'AlarmKit, retiré depuis.
4. À faire ensuite : tester le module Swift `noor-alarm` (jamais compilé avant le prochain build), la page admin, la politique de confidentialité et les fiches des stores, le choix des applis appli par appli sur Android, la connexion Google, un enregistrement personnel de « As-salātu khayrun mina-n-nawm ».

## Règles de travail
- Ne lance jamais `npm install` depuis une machine Linux sur mon dossier Windows (ça casse `node_modules`). Donne-moi les commandes PowerShell à taper.
- Toujours `cd C:\Users\lenovo\Desktop\noor-salat-main` et `$env:EAS_NO_VCS=1` avant une commande EAS.
- Pas de textes coraniques tapés de mémoire : utiliser une source vérifiée (paquet npm `quran-json`). Pas de faux chiffres, faux avis ni logos de marques dans les maquettes.
- Un seul outil d'IA à la fois sur le dossier.

## Session du 9 novembre 2026 (blocage iPhone)
- **Cause du blocage iPhone qui ne marchait pas** : `activitySelectionMetadata` renvoie `webdomainCount` (d minuscule) et non `webDomainCount`. Le total donnait NaN, donc « aucune appli choisie », donc rien n'était programmé. Corrigé dans `selectionCount()` (`src/lib/ios.ts`).
- Liste d'Apple « contrôlée » (`DeviceActivitySelectionSheetView`) : le jeton est enregistré à chaque coche, avec une copie de secours dans AsyncStorage (`ios:selection`), rendue à la bibliothèque si elle l'a perdue.
- Diagnostic du blocage : lignes « Liste Apple » et « Copie de secours » en plus.
- Focus iPhone : refuse de démarrer (avec message) si rien ne peut être bloqué.
- Onboarding : montré une fois à tout le monde (clé `onboarding:done` seulement).
- Mises à jour : bloc version + bouton « Chercher une mise à jour » en bas de Réglages ; l'appli applique une mise à jour dès le lancement (`applyUpdateNow`).
- Build iOS n° 3 (runtime 4e843781…) sur TestFlight : reçoit les mises à jour du canal production.
