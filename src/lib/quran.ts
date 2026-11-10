import AsyncStorage from '@react-native-async-storage/async-storage';

export type Surah = { number: number; name: string; englishName: string; numberOfAyahs: number; revelationType: 'Meccan' | 'Medinan' };

/** Début de chaque juz (sourate:verset). */
export const JUZ: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 83], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

/** Liste des 114 sourates : incluse dans l'appli, donc disponible hors ligne. */
export async function loadSurahs(): Promise<Surah[]> {
  return localSurahs();
}

/** Normalise un nom pour la recherche : « Ya-Sin » → « yasin ». */
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

/* ---------- Coran hors ligne (inclus dans l'appli) ----------
 * src/data/quran.json : généré par script depuis le paquet npm quran-json 3.1.2 (source tanzil.net) :
 * texte arabe uthmani et traduction de Muhammad Hamidullah, jamais tapés à la main.
 * Chargé seulement à la première lecture (pas au lancement de l'appli).
 */
type QData = { source: string; s: [string, string, 'M' | 'D'][]; ar: string[][]; fr: string[][] };
let _q: QData | null = null;
let _starts: number[] | null = null; // numéro global du 1er verset de chaque sourate
function Q(): QData {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (!_q) _q = require('../data/quran.json') as QData;
  return _q;
}
function starts() {
  if (!_starts) { let n = 1; _starts = Q().ar.map((s) => { const v = n; n += s.length; return v; }); }
  return _starts;
}
export const AYAH_TOTAL = 6236;

export type LocalAyah = { number: number; surah: number; ayah: number; surahName: string; ar: string; fr: string; ref: string };

function make(s: number, a: number): LocalAyah {
  const q = Q();
  return { number: starts()[s - 1] + a - 1, surah: s, ayah: a, surahName: q.s[s - 1][1], ar: q.ar[s - 1][a - 1], fr: q.fr[s - 1][a - 1], ref: `${q.s[s - 1][1]} · ${s}:${a}` };
}

/** Verset par numéro global (1 à 6236, on reboucle au-delà). */
export function ayahByNumber(n: number): LocalAyah {
  const g = ((((n - 1) % AYAH_TOTAL) + AYAH_TOTAL) % AYAH_TOTAL) + 1;
  const st = starts();
  let s = st.length;
  while (st[s - 1] > g) s--;
  return make(s, g - st[s - 1] + 1);
}

/** `count` versets consécutifs à partir du numéro global `n`. */
export const ayahsFrom = (n: number, count: number) => Array.from({ length: count }, (_, k) => ayahByNumber(n + k));

/** Environ une page de mushaf : des versets consécutifs jusqu'à ~900 caractères arabes (20 versets max). */
export function pageFrom(n: number): LocalAyah[] {
  const out: LocalAyah[] = [];
  let len = 0;
  while (len < 900 && out.length < 20) { const a = ayahByNumber(n + out.length); out.push(a); len += a.ar.length; }
  return out;
}

export function surahAyahs(s: number): LocalAyah[] {
  return Q().ar[s - 1].map((_, i) => make(s, i + 1));
}

/** Un juz : du début indiqué dans JUZ jusqu'au début du suivant. */
export function juzAyahs(j: number): LocalAyah[] {
  const [s0, a0] = JUZ[j - 1];
  const from = starts()[s0 - 1] + a0 - 1;
  const to = j < 30 ? starts()[JUZ[j][0] - 1] + JUZ[j][1] - 1 : AYAH_TOTAL + 1;
  return Array.from({ length: to - from }, (_, k) => ayahByNumber(from + k));
}

export function localSurahs(): Surah[] {
  return Q().s.map(([name, tr, t], i) => ({ number: i + 1, name, englishName: tr, numberOfAyahs: Q().ar[i].length, revelationType: t === 'M' ? 'Meccan' : 'Medinan' }));
}
