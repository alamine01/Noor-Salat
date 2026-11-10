# NOOR SALAT · نور الصلاة — rapport de la version de test

*Ta prière, ta lumière, ton rappel.*
Dossier du projet : `~/NOOR_SALAT` (séparé de MONTAGE_AI).

---

## Mise à jour : iPhone (version 4.3)

- **Blocage des applis sur iPhone** avec Temps d'écran (`react-native-device-activity`) : l'utilisateur autorise Temps d'écran et choisit ses applis dans Réglages. iOS les bloque 5 min après chaque prière pendant 60 min, même appli fermée ; le scan du tapis débloque. Écran de blocage Apple aux couleurs de Noor Salat, avec un bouton qui envoie une notification pour ouvrir l'appli. Limite d'Apple : 20 programmations à la fois, donc 3 jours d'avance (reprogrammés à chaque ouverture).
- **Focus sur iPhone** : mêmes applis, 15 min minimum (règle d'Apple).
- **Réveil Fajr sur iPhone** avec AlarmKit (`react-native-ios-alarmkit`, iOS 26+) : vrai réveil qui sonne en silencieux, puis applis bloquées jusqu'au scan. Avant iOS 26 : notification forte.
- **Noor Filter sur iPhone** : le filtre « sites pour adultes » d'Apple s'active d'un geste dans Taqwa.
- **Réglages iOS** : `app.json` (iOS 16.4 minimum, groupe d'applis `group.com.noorsalat.app`, 3 extensions dans `targets/`).
- **À faire par toi** : demander l'autorisation « Family Controls » à Apple (voir `DEMANDE_APPLE_FAMILY_CONTROLS.md`), ajouter ton Team ID dans `app.json` (`expo.ios.appleTeamId`), puis construire avec EAS. Rien n'a encore été construit ni testé sur un iPhone.

## Mise à jour : fiabilité (version 4.2)

- **Une semaine d'avance** : blocages, notifications, réveil Fajr et rappel Tahajjud sont programmés pour 7 jours. Les heures des jours suivants sont gardées sur le téléphone (une seule fois par jour et par lieu).
- **Après un redémarrage** (ou un changement d'heure, ou une mise à jour de l'appli), Android réarme tout seul les alarmes de prière (`BootReceiver.kt`). Les notifications étaient déjà restaurées par expo-notifications.
- **Réveil Fajr joué par Android** (`AlarmSound.kt`) : le son monte doucement et vibre, même appli fermée et écran verrouillé. Le son choisi est copié sur le téléphone ; s'il manque, c'est la sonnerie d'alarme du téléphone.
- **Bug corrigé** : une prière validée avant l'heure du blocage annule maintenant le blocage prévu.
- **Squats** : nouveau compteur (creux → pic → creux, 0,7 à 4 s par squat, les secousses ne comptent pas), testé sur des signaux simulés. Les seuils sont dans `src/lib/squats.ts`, à ajuster après essai.
- **Pas encore testé sur un vrai téléphone** : il faut reconstruire l'APK.

## Mise à jour : sauvegarde en ligne (version 4.1)

- **Le téléphone reste la référence** : tout est écrit en local d'abord ; Firebase garde une copie quand internet est là.
- **Envoyé en ligne, et seulement ça** : pseudo, ville choisie, % Noor, séries, total, la liste des prières validées chaque jour (sans l'heure), et l'identifiant du QR de tapis (pour le garder sur un nouveau téléphone). **Jamais** : heures de scan, GPS, photos.
- **Compte (option A)** : invité au départ (anonyme), puis « Sauvegarder mon compte » avec email et mot de passe dans Réglages › Mon compte. Sur un nouveau téléphone : « J'ai déjà un compte » récupère l'historique et le même QR.
- **Classement** : seulement pour ceux qui l'activent, avec un pseudo (pseudo, % Noor, série).
- **Contrôle** : la sauvegarde peut être coupée, et « Supprimer mes données en ligne » efface tout (appui long).
- **Règles de sécurité** : fichier `firestore.rules` à coller dans Firebase › Firestore › Règles. Chacun ne lit que ses données ; l'admin (ton email Google vérifié) lit tout.
- **À activer dans la console Firebase** : Authentication › Anonyme et E-mail/Mot de passe ; créer la base Firestore ; publier les règles.
- La session reste ouverte après fermeture de l'appli (persistance AsyncStorage) : un même utilisateur garde le même identifiant.
- Connexion Google : prévue pour la page admin d'abord, dans l'appli plus tard.

## Mise à jour : design « Nuit profonde + or » (version 4)

- **Nouveau design**, fidèle à la maquette : fond nuit #07090F, un seul accent or #E2C08D, titres en Instrument Serif, texte en Inter, arabe en Amiri. Icônes dessinées au trait, retours tactiles (vibrations) partout.
- **Ouverture** : il faut garder le bouton appuyé ; il se remplit d'or, vibre de plus en plus fort, puis un éclat de lumière ouvre l'accueil. Si une prière, le réveil ou une session Focus est en cours, l'ouverture passe toute seule.
- **Barre du bas flottante** : Accueil, Progrès, bouton doré « scanner mon tapis », Dhikr, Focus. Profil (ن) et Réglages sont en haut de l'accueil.
- **Écrans refaits** : Accueil (anneau de la prochaine prière + compte à rebours), Heure de la prière, Scan (+ « Ce n'est pas ton tapis »), Prière validée (éclat, coche, série +1), Réveil Fajr (aube qui se lève) et squats, Prières (course du soleil), Coran, Tahajjud, Sunna, Taqwa, Profil (QR, Qibla, Compagnons), Réglages, Réglages du réveil.
- **Nouveaux écrans** : Progrès (anneau Noor, semaine, mois), Focus (session de concentration), Lire 5 versets (débloquer sans tapis, traduction Hamidullah), Lecture du Coran (sourate ou juz, la position est gardée).
- **Android (code natif)** : mode Focus, vérification du Noor Filter (DNS privé), réglage « économie de batterie », et le gardien garde en mémoire la dernière appli vue (un trou du blocage est bouché).
- **Différence avec la maquette** : l'écran Focus met en pause toutes les applis (sauf téléphone et urgences). Le choix par catégorie (réseaux sociaux, vidéos, jeux) viendra plus tard : Android limite la lecture de la liste des applis installées.
- **Il faut reconstruire l'APK** : le code Android a changé. Une ancienne sauvegarde du code est dans `_sauvegarde_avant_design_v4/`.

## Mise à jour : horaires pour le Sénégal (version 3)

- **Méthode de calcul par défaut** : Ligue islamique mondiale (MWL) : Fajr 18°, Isha 17°, Asr standard (malikite), fuseau Africa/Dakar. L'appli demande à Aladhan `method=3`, `school=0` et `timezonestring=Africa/Dakar`.
- **Nouvelle page Paramètres** : bouton ⚙ en haut de l'accueil, ou toucher « Horaires locaux · … » sur la carte Prochaine prière.
  - **Ville** : Dakar, Touba, Thiès, Saint-Louis, Kaolack, Ziguinchor, Diourbel, ou « Utiliser ma position GPS » (le choix par défaut, comme avant).
  - **Ajustement manuel** : de -10 à +10 minutes pour chaque prière (Fajr, Dhuhr, Asr, Maghrib, Isha), avec « Remettre à 0 ».
- **Mise à jour automatique** : dès qu'on change la ville ou une minute, les horaires sont recalculés et les rappels sont reprogrammés (notifications, blocage Android, réveil Fajr). Les anciennes alarmes Android sont d'abord effacées.
- **Vérifié sur le web** : avec Touba, le Maghrib passe de 18:40 (Dakar) à 18:33, et +2 min sur le Fajr donne 05:50 au lieu de 05:48. Capture : `captures/v2-vert/7-parametres.jpg`. Les rappels, eux, n'ont pas été testés sur un téléphone.
- **Sans internet** : l'appli reprend les derniers horaires reçus et applique tes ajustements.
- La boussole Qibla du Profil utilise aussi la ville choisie. La position GPS du scan du tapis reste la vraie position.

## Mise à jour : design vert (version 2)

- **Nouveau style** : fond vert #0B3D2E, cartes #0E4A3A, barre du bas #082A1F, titres dorés en Playfair Display, texte en Inter. Le Zeena noir/violet est remplacé, sauf l'écran de blocage (bordeaux) et le réveil Fajr.
- **Accueil** : « Noor Salât » + « Assalamu alaykum », carte Prochaine prière, % Noor (jauge orange) + Streak, 6 boutons.
- **Barre du bas à 5 onglets** : Accueil, Tapis, Fajr, Taqwa, Profil.
- **6 pages** :
  - Prières : la liste du jour ;
  - Coran : les 114 sourates, chargées en ligne ;
  - Tahajjud : le dernier tiers de la nuit, calculé, avec un rappel ;
  - Adhkar : un compteur de tasbih ;
  - Taqwa : NOOR FILTER ;
  - Sunna : une liste à cocher chaque jour.
- **NOOR FILTER, honnêtement** : l'appli **ne filtre pas elle-même**. Elle t'aide à activer le filtre gratuit de Cloudflare (DNS privé `family.cloudflare-dns.com`) dans les réglages Android, ou « Temps d'écran » sur iPhone. Un vrai filtre dans l'appli demanderait un VPN, et Google surveille de près les applis qui en utilisent un.
- **À relire en plus** : les 3 formules du tasbih (Adhkar) et la liste Sunna.
- Sur la carte Prochaine prière, « Exemple d'affichage » ne s'affiche que si les vraies heures n'ont pas pu être chargées. Sinon, c'est écrit « Horaires locaux · ta ville ».

## 1. Ce qui marche vraiment

| Fonction | État |
|---|---|
| **5 écrans au style Zeena** (noir, verre dépoli, violet, orange, pêche, Inter fin + Instrument Serif italique) | ✅ Faits. Captures dans `captures/` (vue d'ensemble : `captures/planche-ecrans.jpg`) |
| **Splash animé** « NOOR SALAT » écrit lettre par lettre, glow orange, puis « نور الصلاة » | ✅ |
| **Icône** : ن doré sur fond noir + petite lune croissante | ✅ (`assets/icon.png`) |
| **Heures de prière du jour** via l'API Aladhan + GPS (Dakar par défaut si le GPS est refusé, dernière version gardée si pas d'internet) | ✅ Vérifié sur le web : vraies heures reçues |
| **% Noor** (prières validées sur 7 jours) et **streak** (jours d'affilée avec les 5 prières) | ✅ Calculés sur le téléphone |
| **Écran de blocage** bordeaux #4A0E1C, lune qui brille, verset 4:103, bouton « J'ai prié - Scanner mon tapis » | ✅ Le bouton retour d'Android ne le ferme pas |
| **Scan du tapis** : QR unique à chaque utilisateur + photo + heure + position GPS | ✅ Codé. Ton QR est dans Profil, à imprimer et coller sur le tapis |
| **Sons** : ding quand le scan est validé, whoosh au déblocage | ✅ (tes fichiers `ding.wav` et `woosh.wav`) |
| **Réveil Fajr** : réglage (avant/après le Fajr), choix de l'audio, le volume monte, vibration, l'écran clignote, la lampe torche clignote | ✅ Codé. Il ne s'arrête qu'après le scan (+ 10 squats si l'option est cochée) |
| **Profil** : stats de la semaine, classement, QR du tapis, boussole Qibla, Coran | ✅ Le texte du Coran vient d'alquran.cloud (édition Uthmani) : il n'est pas recopié à la main |
| **APK Android de test** | ✅ Construit : `NoorSalat-test.apk` (53 Mo, téléphones Android 64 bits). Il est signé avec une clé de test : on peut l'installer à la main, mais pas le publier sur le Play Store. |

## 2. Le blocage des applis sur Android : comment ça marche

L'appli contient du code Android à elle (`modules/noor-blocker`). Elle **n'utilise pas** `react-native-usage-stats` : ce paquet est trop vieux et ne marche plus avec la version actuelle de React Native. Elle fait la même chose directement :

1. Une **alarme exacte** se déclenche 5 min après chaque prière (Dhuhr, Asr, Maghrib, Isha). Pour le Fajr, c'est le réveil.
2. Un **« gardien »** démarre et reste affiché dans les notifications. Toutes les 1,5 seconde, il regarde quelle appli est ouverte, grâce aux **statistiques d'usage**.
3. Si c'est une autre appli (TikTok, Instagram…), il **ramène l'écran de prière devant**, grâce à la permission **superposition**.
4. Le **scan validé** arrête le gardien : tout est débloqué. Par sécurité, il s'arrête aussi tout seul après 60 min (90 min pour le Fajr).
5. Le téléphone, les appels d'urgence et les Réglages restent **toujours ouverts**.

**À faire sur le téléphone, une seule fois :** sur l'accueil, appuyer sur les 3 lignes « Autoriser » : statistiques d'usage, superposition, alarmes exactes. Le bouton « Tester le blocage maintenant » sert à essayer tout de suite.

⚠️ **Pas encore testé sur un vrai téléphone.** Le code est compilé dans l'APK, mais je n'ai pas de téléphone Android pour le vérifier. Certaines marques (Xiaomi, Tecno, Infinix, Samsung) coupent les applis en arrière-plan : il faudra peut-être désactiver « l'optimisation de batterie » pour NOOR SALAT.

**Ce qu'on peut contourner :** quelqu'un peut scanner le QR sans prier, ou passer par les Réglages. L'appli **aide à se rappeler**, elle ne force personne. C'est d'ailleurs l'esprit d'un rappel.

## 3. Le Play Store : attention

- **Statistiques d'usage (`PACKAGE_USAGE_STATS`)** : Google la classe parmi les permissions « sensibles ». Pour publier, il faut remplir une déclaration, expliquer pourquoi l'appli en a besoin et montrer une vidéo. Les applis de « bien-être numérique » et de contrôle du temps d'écran sont acceptées, mais Google peut refuser.
- **Superposition** et **service au premier plan « usage spécial »** : il faudra aussi les justifier dans la console Play.
- **Accessibilité** : je ne l'ai **pas utilisée** exprès. Google interdit d'utiliser l'API d'accessibilité pour bloquer des applis si l'appli n'aide pas des personnes handicapées, et les refus sont fréquents. Les statistiques d'usage sont la voie la plus sûre.
- **Alarmes exactes** : autorisées pour une appli de réveil (le Fajr), mais l'utilisateur doit les accepter sur Android 14 et plus.
- **Rien n'a été publié.** L'APK sert seulement aux tests, à installer à la main.

## 4. iPhone : la limite

**Apple ne laisse pas une appli bloquer les autres applis.** Le seul moyen officiel, « Screen Time / Family Controls », exige une autorisation spéciale qu'Apple accorde au cas par cas, et un Mac avec Xcode. Sur iPhone, NOOR SALAT fait donc :
- une **notification forte** à chaque prière (marquée « urgente » : pour qu'elle passe le mode Concentration, il faudra activer cette option lors de la construction iPhone) ;
- l'écran de prière s'ouvre quand on touche la notification ;
- le réveil Fajr est une notification : sur iPhone, le son ne peut pas monter tout seul quand l'appli est fermée.
- **Le widget iPhone n'est pas encore fait.** Il demande du code Swift et un Mac avec Xcode pour le construire.

## 5. Ce qui est simulé ou pas encore fait

- **Firebase** : le code est prêt (connexion anonyme + Firestore : utilisateurs, prières, streak), mais **il est éteint tant que tu n'as pas donné tes clés**. Sans clés, tout est enregistré sur le téléphone, et le **classement montre un exemple** (Aïcha, Moussa… ce sont des faux noms, c'est écrit « exemple » sur l'écran).
- **Audios du réveil** : une **tonalité douce provisoire** pour les 3 choix. Il me faut tes fichiers (ton message wolof/français, l'adhan, la récitation).
- **NFC** : prévu, pas fait (c'est écrit « prochaine version » dans l'appli).
- **Photo de preuve** : elle reste sur le téléphone, elle n'est pas envoyée sur internet.
- **Après un redémarrage du téléphone**, il faut ouvrir l'appli une fois pour reprogrammer les alarmes.
- **Version web** (pour les captures) : sans caméra, blocage ni alarme. Un bouton « Simuler un scan réussi (test) » n'existe que sur le web et en mode développeur, pas dans l'APK.

## 6. Comment installer l'APK sur ton téléphone

1. Envoie `NoorSalat-test.apk` sur ton téléphone Android (WhatsApp à toi-même, câble USB ou Google Drive).
2. Ouvre-le. Android demande d'autoriser « l'installation d'applis inconnues » : accepte pour cette fois.
3. Ouvre NOOR SALAT, accepte la position, la caméra et les notifications, puis appuie sur les 3 « Autoriser » de l'accueil.
4. Va dans Profil, affiche ton QR et scanne-le depuis un autre écran pour tester.

## 7. À relire par toi avant toute publication

- **Verset 4:103** (écran de blocage) : `إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا`. C'est ton texte, copié tel quel.
- **Traduction affichée sous le verset** : « La prière demeure, pour les croyants, une prescription à des temps déterminés. » **Je l'ai ajoutée moi-même** : vérifie-la, ou donne-moi la traduction que tu préfères.
- Les noms des prières en arabe (الفجر، الظهر، العصر، المغرب، العشاء), « نور الصلاة » et « ن ».
- Phrase du réveil : « La prière vaut mieux que le sommeil. »
- Calcul des heures : méthode « Ligue islamique mondiale » (Fajr 18°, Isha 17°, Asr malikite). Si ta mosquée a quelques minutes d'écart, utilise l'ajustement dans Paramètres.

## 8. Ce qu'il me faut de toi

1. **Tes clés Firebase** : crée un projet sur console.firebase.google.com, ajoute une « appli Web », active « Authentication > Anonyme » et « Firestore ». Ensuite, copie les 6 valeurs dans `.env` (le modèle est dans `.env.example`).
2. **Tes fichiers audio** : message wolof/français, adhan doux, récitation (mp3 ou wav).
3. **Ta relecture** des textes arabes et coraniques (section 6).
