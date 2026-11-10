# Tester Noor Salat sur Android (APK de test)

## 1. Compiler (dans PowerShell, dossier du projet)

```powershell
npx eas-cli@latest login
$env:EAS_NO_VCS=1
npx eas-cli@latest build -p android --profile preview
```

- À la question « Generate a new Android Keystore? » : **Yes**.
- La compilation se fait sur les serveurs d'Expo (15 à 40 min, parfois plus en offre gratuite).
- À la fin : un lien et un QR code. Ouvre-le sur le téléphone, télécharge l'APK, autorise « Installer des applis inconnues ».

Si la compilation échoue : copie la fin du journal (onglet « Logs » sur expo.dev) et envoie-la à Claude.

## 2. Premier lancement

- [ ] Le splash « maintenir pour entrer » vibre et se remplit
- [ ] Les heures de prière s'affichent (autoriser la position)
- [ ] Paramètres › Blocage : accorder les 4 autorisations (statistiques d'usage, superposition, alarmes exactes, batterie sans restriction)

## 3. Blocage des applis

- [ ] Paramètres › « Tester le blocage maintenant » → ouvrir WhatsApp/TikTok : Noor Salat revient devant
- [ ] Le bouton d'appel d'urgence fonctionne
- [ ] Scanner le QR du tapis (Profil › QR, imprimé ou sur un autre écran) → déblocage
- [ ] « Lire 5 versets » → déblocage après les 5 versets

## 4. Réveil Fajr

- [ ] Réveil Fajr › Tester : le son monte, ça vibre, la lampe clignote
- [ ] Téléphone en silencieux : le réveil sonne quand même
- [ ] Squats : 10 vrais squats comptés, son + vibration + lampe s'arrêtent
- [ ] Vrai test : régler une prière proche (Paramètres › Ajustement) ou attendre le Fajr, appli fermée

## 5. Fiabilité

- [ ] Fermer l'appli (balayer), attendre l'heure d'une prière : notification + blocage 5 min après
- [ ] Redémarrer le téléphone, puis attendre la prière suivante : le blocage marche toujours
- [ ] Rappels « 10 min avant », « +15 min », « +30 min » ; ces deux derniers disparaissent si la prière est validée

## 6. Le reste

- [ ] Tahajjud : « Tester le rappel (dans 10 secondes) »
- [ ] Focus 25 min : les applis sont bloquées, l'appui long arrête
- [ ] Noor Filter : DNS privé configuré → « Actif »
- [ ] Compte : créer un compte e-mail, se déconnecter, se reconnecter → l'historique revient
- [ ] Qibla et Tasbih

Note pour chaque point : OK / pas OK + marque du téléphone (Tecno, Infinix, Samsung…).
