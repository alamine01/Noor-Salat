import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Rappels affichés sur l'écran de blocage : tirés au hasard, sans répétition tant que la liste n'est pas épuisée.
 * Versets : texte arabe uthmani et traduction de Muhammad Hamidullah, copiés tels quels du paquet npm
 * quran-json 3.1.2 (source tanzil.net) par un script, jamais tapés à la main.
 * Hadiths : sens rapporté, source indiquée. « Noor Salat » : textes d'encouragement écrits pour l'appli.
 */
export type Rappel = { ar?: string; fr: string; ref: string; pools: ('priere' | 'focus')[] };

export const RAPPELS: Rappel[] = [
 {
  "ar": "ٱلَّذِينَ يُؤۡمِنُونَ بِٱلۡغَيۡبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقۡنَٰهُمۡ يُنفِقُونَ",
  "fr": "qui croient à l'invisible et accomplissent la Salât et dépensent (dans l'obéissance à Allah), de ce que Nous leur avons attribué.",
  "ref": "Al-Baqarah · 2:3",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَأَقِيمُواْ ٱلصَّلَوٰةَ وَءَاتُواْ ٱلزَّكَوٰةَ وَٱرۡكَعُواْ مَعَ ٱلرَّـٰكِعِينَ",
  "fr": "Et accomplissez la Salât, et acquittez la Zakât, et inclinez-vous avec ceux qui s'inclinent.",
  "ref": "Al-Baqarah · 2:43",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَٱسۡتَعِينُواْ بِٱلصَّبۡرِ وَٱلصَّلَوٰةِۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلۡخَٰشِعِينَ",
  "fr": "Et cherchez secours dans l'endurance et la salât: certes, la Salât est une lourde obligation, sauf pour les humbles.",
  "ref": "Al-Baqarah · 2:45",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "وَأَقِيمُواْ ٱلصَّلَوٰةَ وَءَاتُواْ ٱلزَّكَوٰةَۚ وَمَا تُقَدِّمُواْ لِأَنفُسِكُم مِّنۡ خَيۡرٖ تَجِدُوهُ عِندَ ٱللَّهِۗ إِنَّ ٱللَّهَ بِمَا تَعۡمَلُونَ بَصِيرٞ",
  "fr": "Et accomplissez la Salât et acquittez la Zakât. Et tout ce que vous avancez de bien pour vous-mêmes, vous le retrouverez auprès d'Allah, car Allah voit parfaitement ce que vous faites.",
  "ref": "Al-Baqarah · 2:110",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَلِلَّهِ ٱلۡمَشۡرِقُ وَٱلۡمَغۡرِبُۚ فَأَيۡنَمَا تُوَلُّواْ فَثَمَّ وَجۡهُ ٱللَّهِۚ إِنَّ ٱللَّهَ وَٰسِعٌ عَلِيمٞ",
  "fr": "A Allah seul appartiennent l'Est et l'Ouest. Où que vous vous tourniez, la Face (direction) d'Allah est donc là, car Allah a la grâce immense; Il est Omniscient.",
  "ref": "Al-Baqarah · 2:115",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "فَٱذۡكُرُونِيٓ أَذۡكُرۡكُمۡ وَٱشۡكُرُواْ لِي وَلَا تَكۡفُرُونِ",
  "fr": "Souvenez-vous de Moi donc. Je vous récompenserai. Remerciez-Moi et ne soyez pas ingrats envers Moi.",
  "ref": "Al-Baqarah · 2:152",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱسۡتَعِينُواْ بِٱلصَّبۡرِ وَٱلصَّلَوٰةِۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
  "fr": "O les croyants! Cherchez secours dans l'endurance et la Salât. Car Allah est avec ceux qui sont endurants.",
  "ref": "Al-Baqarah · 2:153",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "ٱلَّذِينَ إِذَآ أَصَٰبَتۡهُم مُّصِيبَةٞ قَالُوٓاْ إِنَّا لِلَّهِ وَإِنَّآ إِلَيۡهِ رَٰجِعُونَ",
  "fr": "qui disent, quand un malheur les atteint: «Certes nous sommes à Allah, et c'est à Lui que nous retournerons.",
  "ref": "Al-Baqarah · 2:156",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌۖ أُجِيبُ دَعۡوَةَ ٱلدَّاعِ إِذَا دَعَانِۖ فَلۡيَسۡتَجِيبُواْ لِي وَلۡيُؤۡمِنُواْ بِي لَعَلَّهُمۡ يَرۡشُدُونَ",
  "fr": "Et quand Mes serviteurs t'interrogent sur Moi… alors Je suis tout proche: Je réponds à l'appel de celui qui Me prie quand il Me prie. Qu'ils répondent à Mon appel, et qu'ils croient en Moi, afin qu'ils soient bien guidés.",
  "ref": "Al-Baqarah · 2:186",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "حَٰفِظُواْ عَلَى ٱلصَّلَوَٰتِ وَٱلصَّلَوٰةِ ٱلۡوُسۡطَىٰ وَقُومُواْ لِلَّهِ قَٰنِتِينَ",
  "fr": "Soyez assidus aux Salâts et surtout la Salât médiane; et tenez-vous debout devant Allah, avec humilité.",
  "ref": "Al-Baqarah · 2:238",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "۞وَسَارِعُوٓاْ إِلَىٰ مَغۡفِرَةٖ مِّن رَّبِّكُمۡ وَجَنَّةٍ عَرۡضُهَا ٱلسَّمَٰوَٰتُ وَٱلۡأَرۡضُ أُعِدَّتۡ لِلۡمُتَّقِينَ",
  "fr": "Et concourez au pardon de votre Seigneur, et à un Jardin (paradis) large comme les cieux et la terre, préparé pour les pieux.",
  "ref": "Ali 'Imran · 3:133",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "كُلُّ نَفۡسٖ ذَآئِقَةُ ٱلۡمَوۡتِۗ وَإِنَّمَا تُوَفَّوۡنَ أُجُورَكُمۡ يَوۡمَ ٱلۡقِيَٰمَةِۖ فَمَن زُحۡزِحَ عَنِ ٱلنَّارِ وَأُدۡخِلَ ٱلۡجَنَّةَ فَقَدۡ فَازَۗ وَمَا ٱلۡحَيَوٰةُ ٱلدُّنۡيَآ إِلَّا مَتَٰعُ ٱلۡغُرُورِ",
  "fr": "Toute âme goûtera la mort. Mais c'est seulement au Jour de la Résurrection que vous recevrez votre entière rétribution. Quiconque donc est écarté du Feu et introduit au Paradis, a certes réussi. Et la vie présente n'est qu'un objet de jouissance trompeuse.",
  "ref": "Ali 'Imran · 3:185",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "ٱلَّذِينَ يَذۡكُرُونَ ٱللَّهَ قِيَٰمٗا وَقُعُودٗا وَعَلَىٰ جُنُوبِهِمۡ وَيَتَفَكَّرُونَ فِي خَلۡقِ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضِ رَبَّنَا مَا خَلَقۡتَ هَٰذَا بَٰطِلٗا سُبۡحَٰنَكَ فَقِنَا عَذَابَ ٱلنَّارِ",
  "fr": "qui, debout, assis, couchés sur leurs côtés, invoquent Allah et méditent sur la création des cieux et de la terre (disant): «Notre Seigneur! Tu n'as pas créé cela en vain. Gloire à Toi! Garde-nous du châtiment du Feu.",
  "ref": "Ali 'Imran · 3:191",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱصۡبِرُواْ وَصَابِرُواْ وَرَابِطُواْ وَٱتَّقُواْ ٱللَّهَ لَعَلَّكُمۡ تُفۡلِحُونَ",
  "fr": "O les croyants! Soyez endurants. Incitez-vous à l'endurance. Luttez constamment (contre l'ennemi) et craignez Allah, afin que vous réussissiez.",
  "ref": "Ali 'Imran · 3:200",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "فَإِذَا قَضَيۡتُمُ ٱلصَّلَوٰةَ فَٱذۡكُرُواْ ٱللَّهَ قِيَٰمٗا وَقُعُودٗا وَعَلَىٰ جُنُوبِكُمۡۚ فَإِذَا ٱطۡمَأۡنَنتُمۡ فَأَقِيمُواْ ٱلصَّلَوٰةَۚ إِنَّ ٱلصَّلَوٰةَ كَانَتۡ عَلَى ٱلۡمُؤۡمِنِينَ كِتَٰبٗا مَّوۡقُوتٗا",
  "fr": "Quand vous avez accompli la Salât, invoquez le nom d'Allah, debout, assis ou couchés sur vos côtés. Puis lorsque vous êtes en sécurité, accomplissez la Salât (normalement), car la Salât demeure, pour les croyants, une prescription, à des temps déterminés.",
  "ref": "An-Nisa · 4:103",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَمَا ٱلۡحَيَوٰةُ ٱلدُّنۡيَآ إِلَّا لَعِبٞ وَلَهۡوٞۖ وَلَلدَّارُ ٱلۡأٓخِرَةُ خَيۡرٞ لِّلَّذِينَ يَتَّقُونَۚ أَفَلَا تَعۡقِلُونَ",
  "fr": "La présente vie n'est que jeu et amusement. La demeure dans l'au-delà sera meilleure pour ceux qui sont pieux. Eh bien, ne comprenez-vous pas.",
  "ref": "Al-An'am · 6:32",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "قُلۡ إِنَّ صَلَاتِي وَنُسُكِي وَمَحۡيَايَ وَمَمَاتِي لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ",
  "fr": "Dis: «En vérité, ma Salât, mes actes de dévotion, ma vie et ma mort appartiennent à Allah, Seigneur de l'Univers.",
  "ref": "Al-An'am · 6:162",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَٱذۡكُر رَّبَّكَ فِي نَفۡسِكَ تَضَرُّعٗا وَخِيفَةٗ وَدُونَ ٱلۡجَهۡرِ مِنَ ٱلۡقَوۡلِ بِٱلۡغُدُوِّ وَٱلۡأٓصَالِ وَلَا تَكُن مِّنَ ٱلۡغَٰفِلِينَ",
  "fr": "Et invoque ton Seigneur en toi-même, en humilité et crainte, à mi-voix, le matin et le soir, et ne sois pas du nombre des insouciants.",
  "ref": "Al-A'raf · 7:205",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "إِنَّمَا ٱلۡمُؤۡمِنُونَ ٱلَّذِينَ إِذَا ذُكِرَ ٱللَّهُ وَجِلَتۡ قُلُوبُهُمۡ وَإِذَا تُلِيَتۡ عَلَيۡهِمۡ ءَايَٰتُهُۥ زَادَتۡهُمۡ إِيمَٰنٗا وَعَلَىٰ رَبِّهِمۡ يَتَوَكَّلُونَ",
  "fr": "Les vrais croyants sont ceux dont les cœurs frémissent quand on mentionne Allah. Et quand Ses versets leur sont récités, cela fait augmenter leur foi. Et ils placent leur confiance en leur Seigneur.",
  "ref": "Al-Anfal · 8:2",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَأَقِمِ ٱلصَّلَوٰةَ طَرَفَيِ ٱلنَّهَارِ وَزُلَفٗا مِّنَ ٱلَّيۡلِۚ إِنَّ ٱلۡحَسَنَٰتِ يُذۡهِبۡنَ ٱلسَّيِّـَٔاتِۚ ذَٰلِكَ ذِكۡرَىٰ لِلذَّـٰكِرِينَ",
  "fr": "Et accomplis la Salât aux deux extrémités du jour et à certaines heures de la nuit. Les bonnes œuvres dissipent les mauvaises. Cela est une exhortation pour ceux qui réfléchissent.",
  "ref": "Hud · 11:114",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "ٱلَّذِينَ ءَامَنُواْ وَتَطۡمَئِنُّ قُلُوبُهُم بِذِكۡرِ ٱللَّهِۗ أَلَا بِذِكۡرِ ٱللَّهِ تَطۡمَئِنُّ ٱلۡقُلُوبُ",
  "fr": "ceux qui ont cru, et dont les cœurs se tranquillisent à l'évocation d'Allah». Certes, c'est par l'évocation d'Allah que les cœurs se tranquillisent.",
  "ref": "Ar-Ra'd · 13:28",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "وَإِذۡ تَأَذَّنَ رَبُّكُمۡ لَئِن شَكَرۡتُمۡ لَأَزِيدَنَّكُمۡۖ وَلَئِن كَفَرۡتُمۡ إِنَّ عَذَابِي لَشَدِيدٞ",
  "fr": "Et lorsque votre Seigneur proclama: «Si vous êtes reconnaissants, très certainement J'augmenterai [Mes bienfaits] pour vous. Mais si vous êtes ingrats, Mon châtiment sera terrible»",
  "ref": "Ibrahim · 14:7",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "رَبِّ ٱجۡعَلۡنِي مُقِيمَ ٱلصَّلَوٰةِ وَمِن ذُرِّيَّتِيۚ رَبَّنَا وَتَقَبَّلۡ دُعَآءِ",
  "fr": "O mon Seigneur! Fais que j'accomplisse assidûment la Salât ainsi qu'une partie de ma descendance; exauce ma prière, ô notre Seigneur.",
  "ref": "Ibrahim · 14:40",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَٱعۡبُدۡ رَبَّكَ حَتَّىٰ يَأۡتِيَكَ ٱلۡيَقِينُ",
  "fr": "et adore ton Seigneur jusqu'à ce que te vienne la certitude (la mort).",
  "ref": "Al-Hijr · 15:99",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "مَنۡ عَمِلَ صَٰلِحٗا مِّن ذَكَرٍ أَوۡ أُنثَىٰ وَهُوَ مُؤۡمِنٞ فَلَنُحۡيِيَنَّهُۥ حَيَوٰةٗ طَيِّبَةٗۖ وَلَنَجۡزِيَنَّهُمۡ أَجۡرَهُم بِأَحۡسَنِ مَا كَانُواْ يَعۡمَلُونَ",
  "fr": "Quiconque, mâle ou femelle, fait une bonne œuvre tout en étant croyant, Nous lui ferons vivre une bonne vie. Et Nous les récompenserons, certes, en fonction des meilleures de leurs actions.",
  "ref": "An-Nahl · 16:97",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "إِنَّ ٱللَّهَ مَعَ ٱلَّذِينَ ٱتَّقَواْ وَّٱلَّذِينَ هُم مُّحۡسِنُونَ",
  "fr": "Certes, Allah est avec ceux qui [L'] ont craint avec piété et ceux qui sont bienfaisants.",
  "ref": "An-Nahl · 16:128",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "أَقِمِ ٱلصَّلَوٰةَ لِدُلُوكِ ٱلشَّمۡسِ إِلَىٰ غَسَقِ ٱلَّيۡلِ وَقُرۡءَانَ ٱلۡفَجۡرِۖ إِنَّ قُرۡءَانَ ٱلۡفَجۡرِ كَانَ مَشۡهُودٗا",
  "fr": "Accomplis la Salât au déclin du soleil jusqu'à l'obscurité de la nuit, et [fais] aussi la Lecture à l'aube, car la Lecture à l'aube a des témoins.",
  "ref": "Al-Isra · 17:78",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَمِنَ ٱلَّيۡلِ فَتَهَجَّدۡ بِهِۦ نَافِلَةٗ لَّكَ عَسَىٰٓ أَن يَبۡعَثَكَ رَبُّكَ مَقَامٗا مَّحۡمُودٗا",
  "fr": "Et de la nuit consacre une partie [avant l'aube] pour des Salât surérogatoires: afin que ton Seigneur te ressuscite en une position de gloire.",
  "ref": "Al-Isra · 17:79",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "ٱلۡمَالُ وَٱلۡبَنُونَ زِينَةُ ٱلۡحَيَوٰةِ ٱلدُّنۡيَاۖ وَٱلۡبَٰقِيَٰتُ ٱلصَّـٰلِحَٰتُ خَيۡرٌ عِندَ رَبِّكَ ثَوَابٗا وَخَيۡرٌ أَمَلٗا",
  "fr": "Les biens et les enfants sont l'ornement de la vie de ce monde. Cependant, les bonnes œuvres qui persistent ont auprès de ton Seigneur une meilleure récompense et [suscitent] une belle espérance.",
  "ref": "Al-Kahf · 18:46",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "۞فَخَلَفَ مِنۢ بَعۡدِهِمۡ خَلۡفٌ أَضَاعُواْ ٱلصَّلَوٰةَ وَٱتَّبَعُواْ ٱلشَّهَوَٰتِۖ فَسَوۡفَ يَلۡقَوۡنَ غَيًّا",
  "fr": "Puis leur succédèrent des générations qui délaissèrent la prière et suivirent leurs passions. Ils se trouveront en perdition.",
  "ref": "Maryam · 19:59",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "إِنَّنِيٓ أَنَا ٱللَّهُ لَآ إِلَٰهَ إِلَّآ أَنَا۠ فَٱعۡبُدۡنِي وَأَقِمِ ٱلصَّلَوٰةَ لِذِكۡرِيٓ",
  "fr": "Certes, c'est Moi Allah: point de divinité que Moi. Adore-Moi donc et accomplis la Salât pour te souvenir de Moi.",
  "ref": "Taha · 20:14",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَمَنۡ أَعۡرَضَ عَن ذِكۡرِي فَإِنَّ لَهُۥ مَعِيشَةٗ ضَنكٗا وَنَحۡشُرُهُۥ يَوۡمَ ٱلۡقِيَٰمَةِ أَعۡمَىٰ",
  "fr": "Et quiconque se détourne de Mon Rappel, mènera certes, une vie pleine de gêne, et le Jour de la Résurrection Nous l'amènerons aveugle au rassemblement»",
  "ref": "Taha · 20:124",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "فَٱصۡبِرۡ عَلَىٰ مَا يَقُولُونَ وَسَبِّحۡ بِحَمۡدِ رَبِّكَ قَبۡلَ طُلُوعِ ٱلشَّمۡسِ وَقَبۡلَ غُرُوبِهَاۖ وَمِنۡ ءَانَآيِٕ ٱلَّيۡلِ فَسَبِّحۡ وَأَطۡرَافَ ٱلنَّهَارِ لَعَلَّكَ تَرۡضَىٰ",
  "fr": "Supporte patiemment ce qu'ils disent et célèbre Sa louange, avant le lever du soleil, avant son coucher et pendant la nuit; et exalte Sa Gloire aux extrémités du jour. Peut-être auras-tu satisfaction.",
  "ref": "Taha · 20:130",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَأۡمُرۡ أَهۡلَكَ بِٱلصَّلَوٰةِ وَٱصۡطَبِرۡ عَلَيۡهَاۖ لَا نَسۡـَٔلُكَ رِزۡقٗاۖ نَّحۡنُ نَرۡزُقُكَۗ وَٱلۡعَٰقِبَةُ لِلتَّقۡوَىٰ",
  "fr": "Et commande à ta famille la Salât, et fais-la avec persévérance. Nous ne te demandons point de nourriture: c'est à Nous de te nourrir. La bonne fin est réservée à la piété.",
  "ref": "Taha · 20:132",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "ٱقۡتَرَبَ لِلنَّاسِ حِسَابُهُمۡ وَهُمۡ فِي غَفۡلَةٖ مُّعۡرِضُونَ",
  "fr": "[L'échéance] du règlement de leur compte approche pour les hommes, alors que dans leur insouciance ils s'en détournent.",
  "ref": "Al-Anbya · 21:1",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱرۡكَعُواْ وَٱسۡجُدُواْۤ وَٱعۡبُدُواْ رَبَّكُمۡ وَٱفۡعَلُواْ ٱلۡخَيۡرَ لَعَلَّكُمۡ تُفۡلِحُونَ۩",
  "fr": "O vous qui croyez! Inclinez-vous, prosternez-vous, adorez votre Seigneur, et faites le bien. Peut-être réussirez vous.",
  "ref": "Al-Hajj · 22:77",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "قَدۡ أَفۡلَحَ ٱلۡمُؤۡمِنُونَ ٱلَّذِينَ هُمۡ فِي صَلَاتِهِمۡ خَٰشِعُونَ",
  "fr": "Bienheureux sont certes les croyants ceux qui sont humbles dans leur Salât.",
  "ref": "Al-Mu'minun · 23:1-2",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَٱلَّذِينَ هُمۡ عَلَىٰ صَلَوَٰتِهِمۡ يُحَافِظُونَ",
  "fr": "et qui observent strictement leur Salât.",
  "ref": "Al-Mu'minun · 23:9",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "رِجَالٞ لَّا تُلۡهِيهِمۡ تِجَٰرَةٞ وَلَا بَيۡعٌ عَن ذِكۡرِ ٱللَّهِ وَإِقَامِ ٱلصَّلَوٰةِ وَإِيتَآءِ ٱلزَّكَوٰةِ يَخَافُونَ يَوۡمٗا تَتَقَلَّبُ فِيهِ ٱلۡقُلُوبُ وَٱلۡأَبۡصَٰرُ",
  "fr": "des hommes que ni le négoce, ni le troc ne distraient de l'invocation d'Allah, de l'accomplissement de la Salât et de l'acquittement de la Zakât, et qui redoutent un Jour où les cœurs seront bouleversés ainsi que les regards.",
  "ref": "An-Nur · 24:37",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "وَأَقِيمُواْ ٱلصَّلَوٰةَ وَءَاتُواْ ٱلزَّكَوٰةَ وَأَطِيعُواْ ٱلرَّسُولَ لَعَلَّكُمۡ تُرۡحَمُونَ",
  "fr": "Accomplissez la Salât, acquittez la Zakât et obéissez au messager, afin que vous ayez la miséricorde.",
  "ref": "An-Nur · 24:56",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَعِبَادُ ٱلرَّحۡمَٰنِ ٱلَّذِينَ يَمۡشُونَ عَلَى ٱلۡأَرۡضِ هَوۡنٗا وَإِذَا خَاطَبَهُمُ ٱلۡجَٰهِلُونَ قَالُواْ سَلَٰمٗا",
  "fr": "Les serviteurs du Tout Miséricordieux sont ceux qui marchent humblement sur terre, qui, lorsque les ignorants s'adressent à eux, disent: «Paix»",
  "ref": "Al-Furqan · 25:63",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "وَٱلَّذِينَ يَبِيتُونَ لِرَبِّهِمۡ سُجَّدٗا وَقِيَٰمٗا",
  "fr": "qui passent les nuits prosternés et debout devant leur Seigneur.",
  "ref": "Al-Furqan · 25:64",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "أَحَسِبَ ٱلنَّاسُ أَن يُتۡرَكُوٓاْ أَن يَقُولُوٓاْ ءَامَنَّا وَهُمۡ لَا يُفۡتَنُونَ",
  "fr": "Est-ce que les gens pensent qu'on les laissera dire: «Nous croyons!» sans les éprouver.",
  "ref": "Al-'Ankabut · 29:2",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "ٱتۡلُ مَآ أُوحِيَ إِلَيۡكَ مِنَ ٱلۡكِتَٰبِ وَأَقِمِ ٱلصَّلَوٰةَۖ إِنَّ ٱلصَّلَوٰةَ تَنۡهَىٰ عَنِ ٱلۡفَحۡشَآءِ وَٱلۡمُنكَرِۗ وَلَذِكۡرُ ٱللَّهِ أَكۡبَرُۗ وَٱللَّهُ يَعۡلَمُ مَا تَصۡنَعُونَ",
  "fr": "Récite ce qui t'est révélé du Livre et accomplis la Salât. En vérité la Salât préserve de la turpitude et du blâmable. Le rappel d'Allah est certes ce qu'il y a de plus grand. Et Allah sait ce que vous faites.",
  "ref": "Al-'Ankabut · 29:45",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَمَا هَٰذِهِ ٱلۡحَيَوٰةُ ٱلدُّنۡيَآ إِلَّا لَهۡوٞ وَلَعِبٞۚ وَإِنَّ ٱلدَّارَ ٱلۡأٓخِرَةَ لَهِيَ ٱلۡحَيَوَانُۚ لَوۡ كَانُواْ يَعۡلَمُونَ",
  "fr": "Cette vie d'ici-bas n'est qu'amusement et jeu. La Demeure de l'au-delà est assurément la vraie vie. S'ils savaient.",
  "ref": "Al-'Ankabut · 29:64",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "فَسُبۡحَٰنَ ٱللَّهِ حِينَ تُمۡسُونَ وَحِينَ تُصۡبِحُونَ",
  "fr": "Glorifiez Allah donc, soir et matin.",
  "ref": "Ar-Rum · 30:17",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "يَٰبُنَيَّ أَقِمِ ٱلصَّلَوٰةَ وَأۡمُرۡ بِٱلۡمَعۡرُوفِ وَٱنۡهَ عَنِ ٱلۡمُنكَرِ وَٱصۡبِرۡ عَلَىٰ مَآ أَصَابَكَۖ إِنَّ ذَٰلِكَ مِنۡ عَزۡمِ ٱلۡأُمُورِ",
  "fr": "O mon enfant accomplis la Salât, commande le convenable, interdis le blâmable et endure ce qui t'arrive avec patience. Telle est la résolution à prendre dans toute entreprise.",
  "ref": "Luqman · 31:17",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "تَتَجَافَىٰ جُنُوبُهُمۡ عَنِ ٱلۡمَضَاجِعِ يَدۡعُونَ رَبَّهُمۡ خَوۡفٗا وَطَمَعٗا وَمِمَّا رَزَقۡنَٰهُمۡ يُنفِقُونَ",
  "fr": "Ils s'arrachent de leurs lits pour invoquer leur Seigneur, par crainte et espoir; et ils font largesse de ce que Nous leur attribuons.",
  "ref": "As-Sajdah · 32:16",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱذۡكُرُواْ ٱللَّهَ ذِكۡرٗا كَثِيرٗا وَسَبِّحُوهُ بُكۡرَةٗ وَأَصِيلًا",
  "fr": "O vous qui croyez! Evoquez Allah d'une façon abondante et glorifiez-Le à la pointe et au déclin du jour.",
  "ref": "Al-Ahzab · 33:41-42",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "أَمَّنۡ هُوَ قَٰنِتٌ ءَانَآءَ ٱلَّيۡلِ سَاجِدٗا وَقَآئِمٗا يَحۡذَرُ ٱلۡأٓخِرَةَ وَيَرۡجُواْ رَحۡمَةَ رَبِّهِۦۗ قُلۡ هَلۡ يَسۡتَوِي ٱلَّذِينَ يَعۡلَمُونَ وَٱلَّذِينَ لَا يَعۡلَمُونَۗ إِنَّمَا يَتَذَكَّرُ أُوْلُواْ ٱلۡأَلۡبَٰبِ",
  "fr": "Est-ce que celui qui, aux heures de la nuit, reste en dévotion, prosterné et debout, prenant garde à l'au-delà et espérant la miséricorde de son Seigneur…. Dis: «Sont-ils égaux, ceux qui savent et ceux qui ne savent pas?» Seuls les doués d'intelligence se rappellent.",
  "ref": "Az-Zumar · 39:9",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "قُلۡ يَٰعِبَادِ ٱلَّذِينَ ءَامَنُواْ ٱتَّقُواْ رَبَّكُمۡۚ لِلَّذِينَ أَحۡسَنُواْ فِي هَٰذِهِ ٱلدُّنۡيَا حَسَنَةٞۗ وَأَرۡضُ ٱللَّهِ وَٰسِعَةٌۗ إِنَّمَا يُوَفَّى ٱلصَّـٰبِرُونَ أَجۡرَهُم بِغَيۡرِ حِسَابٖ",
  "fr": "Dis: «O Mes serviteurs qui avez cru! Craignez votre Seigneur». Ceux qui ici-bas font le bien, auront une bonne [récompense]. La terre d'Allah est vaste et les endurants auront leur pleine récompense sans compter.",
  "ref": "Az-Zumar · 39:10",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "۞قُلۡ يَٰعِبَادِيَ ٱلَّذِينَ أَسۡرَفُواْ عَلَىٰٓ أَنفُسِهِمۡ لَا تَقۡنَطُواْ مِن رَّحۡمَةِ ٱللَّهِۚ إِنَّ ٱللَّهَ يَغۡفِرُ ٱلذُّنُوبَ جَمِيعًاۚ إِنَّهُۥ هُوَ ٱلۡغَفُورُ ٱلرَّحِيمُ",
  "fr": "Dis: «O Mes serviteurs qui avez commis des excès à votre propre détriment, ne désespérez pas de la miséricorde d'Allah. Car Allah pardonne tous les péchés. Oui, c'est Lui le Pardonneur, le Très Miséricordieux.",
  "ref": "Az-Zumar · 39:53",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "وَقَالَ رَبُّكُمُ ٱدۡعُونِيٓ أَسۡتَجِبۡ لَكُمۡۚ إِنَّ ٱلَّذِينَ يَسۡتَكۡبِرُونَ عَنۡ عِبَادَتِي سَيَدۡخُلُونَ جَهَنَّمَ دَاخِرِينَ",
  "fr": "Et votre Seigneur dit: «Appelez-Moi, Je vous répondrai. Ceux qui, par orgueil, se refusent à M'adorer entreront bientôt dans l'Enfer, humiliés»",
  "ref": "Ghafir · 40:60",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "إِنَّ ٱلَّذِينَ قَالُواْ رَبُّنَا ٱللَّهُ ثُمَّ ٱسۡتَقَٰمُواْ تَتَنَزَّلُ عَلَيۡهِمُ ٱلۡمَلَـٰٓئِكَةُ أَلَّا تَخَافُواْ وَلَا تَحۡزَنُواْ وَأَبۡشِرُواْ بِٱلۡجَنَّةِ ٱلَّتِي كُنتُمۡ تُوعَدُونَ",
  "fr": "Ceux qui disent: «Notre Seigneur est Allah», et qui se tiennent dans le droit chemin, les Anges descendent sur eux. «N'ayez pas peur et ne soyez pas affligés; mais ayez la bonne nouvelle du Paradis qui vous était promis.",
  "ref": "Fussilat · 41:30",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "وَلَقَدۡ خَلَقۡنَا ٱلۡإِنسَٰنَ وَنَعۡلَمُ مَا تُوَسۡوِسُ بِهِۦ نَفۡسُهُۥۖ وَنَحۡنُ أَقۡرَبُ إِلَيۡهِ مِنۡ حَبۡلِ ٱلۡوَرِيدِ",
  "fr": "Nous avons effectivement créé l'homme et Nous savons ce que son âme lui suggère et Nous sommes plus près de lui que sa veine jugulaire.",
  "ref": "Qaf · 50:16",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "مَّا يَلۡفِظُ مِن قَوۡلٍ إِلَّا لَدَيۡهِ رَقِيبٌ عَتِيدٞ",
  "fr": "Il ne prononce pas une parole sans avoir auprès de lui un observateur prêt à l'inscrire.",
  "ref": "Qaf · 50:18",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "وَمَا خَلَقۡتُ ٱلۡجِنَّ وَٱلۡإِنسَ إِلَّا لِيَعۡبُدُونِ",
  "fr": "Je n'ai créé les djinns et les hommes que pour qu'ils M'adorent.",
  "ref": "Adh-Dhariyat · 51:56",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱتَّقُواْ ٱللَّهَ وَلۡتَنظُرۡ نَفۡسٞ مَّا قَدَّمَتۡ لِغَدٖۖ وَٱتَّقُواْ ٱللَّهَۚ إِنَّ ٱللَّهَ خَبِيرُۢ بِمَا تَعۡمَلُونَ",
  "fr": "O vous qui avez cru! Craignez Allah. Que chaque âme voit bien ce qu'elle a avancé pour demain. Et craignez Allah, car Allah est Parfaitement Connaisseur de ce que vous faites.",
  "ref": "Al-Hashr · 59:18",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "وَلَا تَكُونُواْ كَٱلَّذِينَ نَسُواْ ٱللَّهَ فَأَنسَىٰهُمۡ أَنفُسَهُمۡۚ أُوْلَـٰٓئِكَ هُمُ ٱلۡفَٰسِقُونَ",
  "fr": "Et ne soyez pas comme ceux qui ont oublié Allah; [Allah] leur a fait alors oublier leurs propres personnes; ceux-là sont les pervers.",
  "ref": "Al-Hashr · 59:19",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓاْ إِذَا نُودِيَ لِلصَّلَوٰةِ مِن يَوۡمِ ٱلۡجُمُعَةِ فَٱسۡعَوۡاْ إِلَىٰ ذِكۡرِ ٱللَّهِ وَذَرُواْ ٱلۡبَيۡعَۚ ذَٰلِكُمۡ خَيۡرٞ لَّكُمۡ إِن كُنتُمۡ تَعۡلَمُونَ",
  "fr": "O vous qui avez cru! Quand on appelle à la Salât du jour du Vendredi, accourez à l'invocation d'Allah et laissez tout négoce. Cela est bien meilleur pour vous, si vous saviez.",
  "ref": "Al-Jumu'ah · 62:9",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "فَإِذَا قُضِيَتِ ٱلصَّلَوٰةُ فَٱنتَشِرُواْ فِي ٱلۡأَرۡضِ وَٱبۡتَغُواْ مِن فَضۡلِ ٱللَّهِ وَٱذۡكُرُواْ ٱللَّهَ كَثِيرٗا لَّعَلَّكُمۡ تُفۡلِحُونَ",
  "fr": "Puis quand la Salât est achevée, dispersez-vous sur terre et recherchez [quelque effet] de la grâce d'Allah, et invoquez beaucoup Allah afin que vous réussissiez.",
  "ref": "Al-Jumu'ah · 62:10",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ لَا تُلۡهِكُمۡ أَمۡوَٰلُكُمۡ وَلَآ أَوۡلَٰدُكُمۡ عَن ذِكۡرِ ٱللَّهِۚ وَمَن يَفۡعَلۡ ذَٰلِكَ فَأُوْلَـٰٓئِكَ هُمُ ٱلۡخَٰسِرُونَ",
  "fr": "O vous qui avez cru! Que ni vos biens ni vos enfants ne vous distraient du rappel d'Allah. Et quiconque fait cela…. alors ceux-là seront les perdants.",
  "ref": "Al-Munafiqun · 63:9",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "فَٱتَّقُواْ ٱللَّهَ مَا ٱسۡتَطَعۡتُمۡ وَٱسۡمَعُواْ وَأَطِيعُواْ وَأَنفِقُواْ خَيۡرٗا لِّأَنفُسِكُمۡۗ وَمَن يُوقَ شُحَّ نَفۡسِهِۦ فَأُوْلَـٰٓئِكَ هُمُ ٱلۡمُفۡلِحُونَ",
  "fr": "Craignez Allah, donc autant que vous pouvez, écoutez, obéissez et faites largesses. Ce sera un bien pour vous. Et quiconque a été protégé contre sa propre avidité…. ceux-là sont ceux qui réussissent.",
  "ref": "At-Taghabun · 64:16",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "وَيَرۡزُقۡهُ مِنۡ حَيۡثُ لَا يَحۡتَسِبُۚ وَمَن يَتَوَكَّلۡ عَلَى ٱللَّهِ فَهُوَ حَسۡبُهُۥٓۚ إِنَّ ٱللَّهَ بَٰلِغُ أَمۡرِهِۦۚ قَدۡ جَعَلَ ٱللَّهُ لِكُلِّ شَيۡءٖ قَدۡرٗا",
  "fr": "et lui accordera Ses dons par [des moyens] sur lesquels il ne comptait pas. Et quiconque place sa confiance en Allah, Il [Allah] lui suffit. Allah atteint ce qu'Il Se propose, et Allah a assigné une mesure à chaque chose.",
  "ref": "At-Talaq · 65:3",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "ٱلَّذِي خَلَقَ ٱلۡمَوۡتَ وَٱلۡحَيَوٰةَ لِيَبۡلُوَكُمۡ أَيُّكُمۡ أَحۡسَنُ عَمَلٗاۚ وَهُوَ ٱلۡعَزِيزُ ٱلۡغَفُورُ",
  "fr": "Celui qui a créé la mort et la vie afin de vous éprouver (et de savoir) qui de vous est le meilleur en œuvre, et c'est Lui le Puissant, le Pardonneur.",
  "ref": "Al-Mulk · 67:2",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "إِلَّا ٱلۡمُصَلِّينَ ٱلَّذِينَ هُمۡ عَلَىٰ صَلَاتِهِمۡ دَآئِمُونَ",
  "fr": "Sauf ceux qui pratiquent la Salât qui sont assidus à leurs Salâts.",
  "ref": "Al-Ma'arij · 70:22-23",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَٱلَّذِينَ هُمۡ عَلَىٰ صَلَاتِهِمۡ يُحَافِظُونَ",
  "fr": "et qui sont réguliers dans leur Salât.",
  "ref": "Al-Ma'arij · 70:34",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَٱذۡكُرِ ٱسۡمَ رَبِّكَ وَتَبَتَّلۡ إِلَيۡهِ تَبۡتِيلٗا",
  "fr": "Et rappelle-toi le nom de ton Seigneur et consacre-toi totalement à Lui.",
  "ref": "Al-Muzzammil · 73:8",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "مَا سَلَكَكُمۡ فِي سَقَرَ قَالُواْ لَمۡ نَكُ مِنَ ٱلۡمُصَلِّينَ",
  "fr": "«Qu'est-ce qui vous a acheminés à Saqar?» Ils diront: «Nous n'étions pas de ceux qui faisaient la Salât.",
  "ref": "Al-Muddaththir · 74:42-43",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَٱذۡكُرِ ٱسۡمَ رَبِّكَ بُكۡرَةٗ وَأَصِيلٗا وَمِنَ ٱلَّيۡلِ فَٱسۡجُدۡ لَهُۥ وَسَبِّحۡهُ لَيۡلٗا طَوِيلًا",
  "fr": "Et invoque le nom de ton Seigneur, matin et après-midi et prosterne-toi devant Lui une partie de la nuit; et glorifie-Le de longues [heures] pendant la nuit.",
  "ref": "Al-Insan · 76:25-26",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "قَدۡ أَفۡلَحَ مَن تَزَكَّىٰ وَذَكَرَ ٱسۡمَ رَبِّهِۦ فَصَلَّىٰ",
  "fr": "Réussit, certes, celui qui se purifie et se rappelle le nom de son Seigneur, puis célèbre la Salât.",
  "ref": "Al-A'la · 87:14-15",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "بَلۡ تُؤۡثِرُونَ ٱلۡحَيَوٰةَ ٱلدُّنۡيَا وَٱلۡأٓخِرَةُ خَيۡرٞ وَأَبۡقَىٰٓ",
  "fr": "Mais, vous préférez plutôt la vie présente alors que l'au-delà est meilleur et plus durable.",
  "ref": "Al-A'la · 87:16-17",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "يَـٰٓأَيَّتُهَا ٱلنَّفۡسُ ٱلۡمُطۡمَئِنَّةُ ٱرۡجِعِيٓ إِلَىٰ رَبِّكِ رَاضِيَةٗ مَّرۡضِيَّةٗ",
  "fr": "«O toi, âme apaisée retourne vers ton Seigneur, satisfaite et agréée.",
  "ref": "Al-Fajr · 89:27-28",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "فَإِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرًا إِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرٗا",
  "fr": "A côté de la difficulté est, certes, une facilité A côté de la difficulté est, certes, une facilité.",
  "ref": "Ash-Sharh · 94:5-6",
  "pools": [
   "focus"
  ]
 },
 {
  "ar": "فَإِذَا فَرَغۡتَ فَٱنصَبۡ وَإِلَىٰ رَبِّكَ فَٱرۡغَب",
  "fr": "Quand tu te libères, donc, lève-toi et à ton Seigneur aspire.",
  "ref": "Ash-Sharh · 94:7-8",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "كَلَّا لَا تُطِعۡهُ وَٱسۡجُدۡۤ وَٱقۡتَرِب۩",
  "fr": "Non! Ne lui obéis pas; mais prosterne-toi et rapproche-toi.",
  "ref": "Al-'Alaq · 96:19",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "وَمَآ أُمِرُوٓاْ إِلَّا لِيَعۡبُدُواْ ٱللَّهَ مُخۡلِصِينَ لَهُ ٱلدِّينَ حُنَفَآءَ وَيُقِيمُواْ ٱلصَّلَوٰةَ وَيُؤۡتُواْ ٱلزَّكَوٰةَۚ وَذَٰلِكَ دِينُ ٱلۡقَيِّمَةِ",
  "fr": "Il ne leur a été commandé, cependant, que d'adorer Allah, Lui vouant un culte exclusif, d'accomplir la Salât et d'acquitter la Zakât. Et voilà la religion de droiture.",
  "ref": "Al-Bayyinah · 98:5",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "فَمَن يَعۡمَلۡ مِثۡقَالَ ذَرَّةٍ خَيۡرٗا يَرَهُۥ وَمَن يَعۡمَلۡ مِثۡقَالَ ذَرَّةٖ شَرّٗا يَرَهُۥ",
  "fr": "Quiconque fait un bien fût-ce du poids d'un atome, le verra et quiconque fait un mal fût-ce du poids d'un atome, le verra.",
  "ref": "Az-Zalzalah · 99:7-8",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "أَلۡهَىٰكُمُ ٱلتَّكَاثُرُ حَتَّىٰ زُرۡتُمُ ٱلۡمَقَابِرَ",
  "fr": "La course aux richesses vous distrait jusqu'à ce que vous visitiez les tombes.",
  "ref": "At-Takathur · 102:1-2",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "وَٱلۡعَصۡرِ إِنَّ ٱلۡإِنسَٰنَ لَفِي خُسۡرٍ إِلَّا ٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّـٰلِحَٰتِ وَتَوَاصَوۡاْ بِٱلۡحَقِّ وَتَوَاصَوۡاْ بِٱلصَّبۡرِ",
  "fr": "Par le Temps L'homme est certes, en perdition sauf ceux qui croient et accomplissent les bonnes œuvres, s'enjoignent mutuellement la vérité et s'enjoignent mutuellement l'endurance.",
  "ref": "Al-'Asr · 103:1-3",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "ar": "فَوَيۡلٞ لِّلۡمُصَلِّينَ ٱلَّذِينَ هُمۡ عَن صَلَاتِهِمۡ سَاهُونَ",
  "fr": "Malheur donc, à ceux qui prient tout en négligeant (et retardant) leur Salât.",
  "ref": "Al-Ma'un · 107:4-5",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "فَصَلِّ لِرَبِّكَ وَٱنۡحَرۡ",
  "fr": "Accomplis la Salât pour ton Seigneur et sacrifie.",
  "ref": "Al-Kawthar · 108:2",
  "pools": [
   "priere"
  ]
 },
 {
  "ar": "إِنَّمَا ٱلۡحَيَوٰةُ ٱلدُّنۡيَا لَعِبٞ وَلَهۡوٞۚ وَإِن تُؤۡمِنُواْ وَتَتَّقُواْ يُؤۡتِكُمۡ أُجُورَكُمۡ وَلَا يَسۡـَٔلۡكُمۡ أَمۡوَٰلَكُمۡ",
  "fr": "La vie présente n'est que jeu et amusement; alors que si vous croyez et craignez, [Allah], Il vous accordera vos récompenses et ne vous demandera pas vos biens.",
  "ref": "Muhammad · 47:36",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "L'œuvre la plus aimée d'Allah : la prière accomplie à son heure.",
  "ref": "Hadith · Al-Bukhari, Muslim",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "La première chose dont le serviteur rendra compte le Jour de la Résurrection, c'est la prière.",
  "ref": "Hadith · At-Tirmidhi, An-Nasa'i",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Le serviteur n'est jamais aussi proche de son Seigneur que lorsqu'il est prosterné.",
  "ref": "Hadith · Muslim",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Les cinq prières sont comme un fleuve devant ta porte, où tu te laves cinq fois par jour.",
  "ref": "Hadith · Al-Bukhari, Muslim",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Profite de ta jeunesse avant ta vieillesse, de ta santé avant ta maladie, de ton temps libre avant tes occupations.",
  "ref": "Hadith · Al-Hakim",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Ton téléphone attendra. Ton Seigneur t'appelle.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Cinq minutes pour Allah. Le reste de la journée t'attendra.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Fais de ta concentration une adoration : chaque minute donnée à ce qui compte est comptée.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Le fil d'actualité ne finit jamais. Ta prière, elle, a une heure.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Ce message peut attendre dix minutes. L'adhan, non.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Personne ne t'a jamais regretté d'avoir prié à l'heure.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Tu as ouvert cette appli par réflexe. Ouvre plutôt ton cœur à la prière.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Pose le téléphone, fais tes ablutions : l'eau lave aussi la fatigue.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Une prière à l'heure vaut mieux que cent « tout à l'heure ».",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Le tapis est plus près que tu ne le penses.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Tes notifications te réclament. Ton Seigneur t'invite.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Le Créateur de ton temps te demande quelques minutes. Donne-les.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Chaque prière est un rendez-vous que tu ne regretteras jamais.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Remplace le défilement par la prosternation.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Tu cherchais une pause ? La plus belle est celle de la prière.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Prie avant qu'on ne prie sur toi.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "La vidéo sera encore là. Cette prière, à cette heure, ne reviendra pas.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Rien de ce que tu verras ici ne vaut une prosternation.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Un pas vers le tapis, et la journée change de couleur.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Allah t'a donné vingt-quatre heures. Il t'en demande à peine une.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Réponds d'abord à l'appel qui compte vraiment.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Ta série Noor t'attend. Ne la casse pas pour un écran.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Les gens de la mosquée ne sont pas plus occupés que toi. Ils ont juste choisi.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Le meilleur moment pour prier, c'est maintenant.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Ce que tu fais pour Allah n'est jamais du temps perdu.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "fr": "La paix que tu cherches ici se trouve sur ton tapis.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Un cœur occupé par Allah n'a pas besoin de distraction.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "fr": "Prie comme si c'était ta dernière prière.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Avant de faire défiler, prosterne-toi.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Laisse le monde attendre un instant : tu parles à son Créateur.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Ton âme aussi a besoin d'une recharge. Elle s'appelle la prière.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Tu ne perds rien en priant. Tu perds tout en oubliant.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Commence par Allah, et le reste suivra.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "fr": "La prière est ta pause, ton refuge et ta force.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Personne ne te verra prier en secret. Allah, si.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Fais ce que tu as à faire, puis reviens à ton Seigneur.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Ta concentration est un amana : ne la donne pas à n'importe quoi.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Un écran éteint, un esprit allumé.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Dix minutes de vraie concentration valent une heure d'éparpillement.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Ce que tu construis maintenant, tu le récolteras demain.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Ton temps est ta vie. Ne le donne pas à ceux qui ne te le rendront pas.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Bismillah, et au travail.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Reste sur ta tâche. Le reste peut attendre.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Chaque minute gagnée sur la distraction est une victoire sur toi-même.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Fais-le pour Allah, et même l'effort devient adoration.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "La discipline d'aujourd'hui est la liberté de demain.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Tu n'as pas besoin de plus de temps, mais de moins de distractions.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Dis « Bismillah » et reprends là où tu t'étais arrêté.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Garde ton cœur occupé par le dhikr pendant que tes mains travaillent.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "Les grandes choses se font dans le calme, pas dans le défilement.",
  "ref": "Noor Salat",
  "pools": [
   "focus"
  ]
 },
 {
  "fr": "SubhanAllah, Alhamdulillah, Allahu Akbar : trois mots pour remplacer trois minutes d'écran.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "fr": "Astaghfirullah. Un mot léger sur la langue, lourd dans la balance.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "fr": "Plutôt que de chercher quoi regarder, cherche quoi invoquer.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "fr": "Ce soir, tu ne te souviendras pas de cette vidéo. Tu te souviendras de ta prière.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Le Fajr gagné commence la veille, en éteignant l'écran à temps.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "fr": "Ta journée est entre deux prières. Remplis-la de bien.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 },
 {
  "fr": "Celui qui garde sa prière garde le reste.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "La prière ne te prend pas du temps. Elle donne de la valeur au reste.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Tu as le droit de te reposer. Fais-le après avoir prié.",
  "ref": "Noor Salat",
  "pools": [
   "priere"
  ]
 },
 {
  "fr": "Allah est plus proche de toi que ce téléphone.",
  "ref": "Noor Salat",
  "pools": [
   "priere",
   "focus"
  ]
 }
];

export type Pool = 'priere' | 'focus';
const pool = (p: Pool) => RAPPELS.filter((r) => r.pools.includes(p));

/**
 * Un rappel au hasard. On tire dans un « paquet » mélangé : aucun rappel ne revient
 * avant que tous les autres soient passés.
 */
export async function nextRappel(p: Pool = 'priere'): Promise<Rappel> {
  const list = pool(p);
  const key = `rappel:deck:${p}`;
  let deck: number[] = [];
  try { deck = JSON.parse((await AsyncStorage.getItem(key)) ?? '[]'); } catch {}
  deck = deck.filter((i) => i < list.length);
  if (!deck.length) {
    deck = list.map((_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  }
  const i = deck.shift()!;
  AsyncStorage.setItem(key, JSON.stringify(deck)).catch(() => {});
  return list[i];
}

/** Textes pour l'écran Apple (iPhone) : texte simple seulement, et assez court pour tenir sans être coupé. */
export const shieldTexts = (p: Pool) => pool(p).filter((r) => r.fr.length <= 190).map((r) => `${quote(r.fr)}\n— ${r.ref}`);

/** Met le texte entre « », sans doubler ceux que la traduction contient déjà (paroles rapportées). */
function quote(t: string) {
  const clean = t.replace(/[«»]/g, '').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
  return `« ${clean} »`;
}
