import type { PrayerKey } from './prayer';

/**
 * Textes des rappels de prière. Pour chaque prière, jusqu'à 4 notifications :
 *  - before : 10 min avant
 *  - at     : à l'heure
 *  - nudge  : +15 min, un rappel propre à chaque prière (Coran / hadith)
 *  - late   : +30 min, si la prière n'est toujours pas validée
 * Les rappels « nudge » et « late » sont annulés dès que la prière est validée.
 * Les textes tournent chaque jour pour ne pas lasser.
 */
export type Slot = 'before' | 'at' | 'nudge' | 'late';
type Msg = { title: string; body: string };

const BEFORE = [
  'Pose ce que tu fais. Prépare tes ablutions.',
  'Encore 10 minutes. Ce que tu fais peut attendre, ta prière non.',
  'Prépare-toi comme pour un rendez-vous important. Car c’en est un.',
  'Les ablutions effacent les péchés, goutte après goutte. Va les faire.',
  'Termine ta phrase, range ton téléphone. La prière approche.',
];

const AT = [
  'Ta lumière t’attend. Scanne ton tapis après ta prière.',
  '« La prière est prescrite aux croyants à des heures déterminées. » (Coran, 4:103)',
  'L’œuvre la plus aimée d’Allah : la prière à son heure, a dit le Prophète ﷺ.',
  '« C’est par l’évocation d’Allah que les cœurs se tranquillisent. » (Coran, 13:28)',
  'Cinq prières, comme un fleuve devant ta porte où tu te laves cinq fois par jour.',
];

const LATE = [
  'Tu la repousses encore ? Quelques minutes suffisent. Lève-toi maintenant.',
  'La première chose dont on te demandera compte, c’est la prière.',
  '« Seigneur, si seulement Tu m’accordais un court délai… » (Coran, 63:10) Ce délai, c’est maintenant.',
  'Rien de ce que tu fais là ne t’accompagnera. Ta prière, si.',
  'Il est encore temps. Ne laisse pas filer cette prière.',
];

/** Un rappel propre à chaque prière, envoyé 15 min après l'heure. */
const NUDGE: Record<PrayerKey, Msg[]> = {
  Fajr: [
    { title: '🛡️ Une protection t’attend', body: 'Qui prie le Fajr est sous la protection d’Allah, a dit le Prophète ﷺ.' },
    { title: '🌅 Mieux que ce monde', body: 'Les deux rak‘a de l’aube valent mieux que ce monde et ce qu’il contient, a dit le Prophète ﷺ.' },
    { title: '😴 La prière vaut mieux que le sommeil', body: 'Le sommeil reviendra. Ce Fajr, lui, ne reviendra pas.' },
  ],
  Dhuhr: [
    { title: '💼 Ton travail peut attendre', body: '« Nous ne te demandons pas de subsistance : c’est Nous qui te nourrissons. » (Coran, 20:132)' },
    { title: '☀️ Une pause pour ton cœur', body: 'Cinq minutes loin de l’écran, face à ton Seigneur. Tu reviendras plus léger.' },
    { title: '📿 Ta réunion la plus importante', body: 'Celle-là, personne ne peut la décaler à ta place.' },
  ],
  Asr: [
    { title: '⚠️ La prière du milieu', body: '« Soyez assidus aux prières, et surtout à la prière médiane. » (Coran, 2:238)' },
    { title: '🌤️ Ne laisse pas filer l’Asr', body: 'Le Prophète ﷺ a mis en garde contre celui qui manque l’Asr : c’est comme perdre sa famille et ses biens.' },
    { title: '⏳ L’après-midi passe vite', body: '« Par le temps ! L’homme est certes en perdition, sauf ceux qui croient… » (Coran, 103)' },
  ],
  Maghrib: [
    { title: '🌇 Le Maghrib est court', body: 'Son temps file vite. Prie maintenant, avant qu’il ne soit trop tard.' },
    { title: '🤲 Le soleil s’est couché', body: 'Une journée de plus t’a été donnée. Remercie Celui qui te l’a offerte.' },
    { title: '🛑 Arrête tout trois minutes', body: 'La prière préserve de la turpitude et du blâmable. (Coran, 29:45)' },
  ],
  Isha: [
    { title: '🌙 Même en rampant', body: 'Si les gens savaient ce qu’il y a dans l’Isha et le Fajr, ils y viendraient même en rampant, a dit le Prophète ﷺ.' },
    { title: '🛏️ Avant de dormir', body: 'Termine ta journée avec ton Seigneur, pas avec ton fil d’actualité.' },
    { title: '✨ La moitié de la nuit', body: 'Qui prie l’Isha en groupe, c’est comme s’il avait prié la moitié de la nuit, a dit le Prophète ﷺ.' },
  ],
};

/** Choix stable du texte selon le jour (dayIndex) : change chaque jour, identique si on reprogramme. */
const pick = <T,>(list: T[], seed: number) => list[((seed % list.length) + list.length) % list.length];

export function prayerMessage(slot: Slot, p: { key: PrayerKey; fr: string; ar: string }, dayIndex: number, prayerIndex: number): Msg {
  const seed = dayIndex + prayerIndex * 3;
  switch (slot) {
    case 'before': return { title: `⏰ ${p.fr} dans 10 min`, body: pick(BEFORE, seed) };
    case 'at': return { title: `Il est l’heure de ${p.fr} · ${p.ar}`, body: pick(AT, seed) };
    case 'nudge': return pick(NUDGE[p.key], dayIndex);
    case 'late': return { title: `⏳ ${p.fr}, il y a 30 min`, body: pick(LATE, seed) };
  }
}

/** Décalage de chaque rappel par rapport à l'heure de la prière, en minutes. */
export const SLOT_OFFSET: Record<Slot, number> = { before: -10, at: 0, nudge: 15, late: 30 };
export const SLOTS: Slot[] = ['before', 'at', 'nudge', 'late'];
