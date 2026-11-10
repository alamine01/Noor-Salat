import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYERS, PrayerKey, todayKey } from './prayer';
import { syncDay, syncProfile } from './firebase';

export type PrayerLog = {
  prayer: PrayerKey;
  at: string; // ISO
  photoUri?: string;
  lat?: number;
  lng?: number;
  method: 'qr' | 'nfc' | 'demo' | 'versets' | 'cloud';
};

export type FajrSettings = {
  enabled: boolean;
  offsetMin: number; // minutes avant (-) / après (+) l'heure du Fajr
  audio: AlarmSoundKey;
  squats: boolean;
};

/** Sonneries du réveil Fajr : « As-salātu khayrun mina-n-nawm », l'adhan du Fajr, ou la sonnerie du téléphone. */
export type AlarmSoundKey = 'khayr' | 'adhan_fajr' | 'systeme';
export const ALARM_SOUNDS: AlarmSoundKey[] = ['khayr', 'adhan_fajr', 'systeme'];

const DEFAULT_FAJR: FajrSettings = { enabled: true, offsetMin: -10, audio: 'khayr', squats: false };

/** Adhan joué par la notification à l'heure de chaque prière (sauf Fajr, qui a son réveil). */
export type AdhanKey = 'beautiful' | 'none';
export async function getAdhan(): Promise<AdhanKey> {
  const v = await getJSON<string>('adhanSound', 'beautiful');
  return v === 'none' ? 'none' : 'beautiful'; // anciens choix retirés → adhan
}
export const setAdhan = (v: AdhanKey) => setJSON('adhanSound', v);

async function getJSON<T>(k: string, def: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : def;
  } catch {
    return def;
  }
}
const setJSON = (k: string, v: unknown) => AsyncStorage.setItem(k, JSON.stringify(v));

/** Identifiant unique de l'utilisateur, utilisé dans son QR de tapis. */
export async function getUserId() {
  let id = await AsyncStorage.getItem('userId');
  if (!id) {
    id = 'NS-' + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase();
    await AsyncStorage.setItem('userId', id);
  }
  return id;
}

export const qrPayload = (userId: string) => `noorsalat://tapis/${userId}`;

export async function getDayLogs(day = todayKey()) {
  return getJSON<PrayerLog[]>('logs:' + day, []);
}

export async function logPrayer(log: PrayerLog) {
  const day = todayKey(new Date(log.at));
  const logs = await getDayLogs(day);
  if (!logs.find((l) => l.prayer === log.prayer)) logs.push(log);
  await setJSON('logs:' + day, logs);
  // Copie en ligne (sans heure, GPS ni photo), si la sauvegarde est active.
  syncDay(day).then(() => syncProfile()).catch(() => {});
  return logs;
}

/** % Noor : part des 5 prières validées sur les 7 derniers jours. */
export async function noorPercent() {
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    done += (await getDayLogs(todayKey(d))).length;
  }
  return Math.round((done / 35) * 100);
}

/** Streak : jours consécutifs avec les 5 prières (aujourd'hui compte s'il est déjà complet). */
export async function streakDays() {
  let s = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const n = (await getDayLogs(todayKey(d))).length;
    if (n >= PRAYERS.length) s++;
    else if (i === 0) continue;
    else break;
  }
  return s;
}

export async function weekStats() {
  const out: { day: string; count: number }[] = [];
  const names = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ day: names[d.getDay()], count: (await getDayLogs(todayKey(d))).length });
  }
  return out;
}

export async function getFajr(): Promise<FajrSettings> {
  const s = await getJSON<FajrSettings>('fajr', DEFAULT_FAJR);
  // Anciennes versions (sons provisoires) → « As-salātu khayrun mina-n-nawm ».
  return ALARM_SOUNDS.includes(s.audio) ? s : { ...s, audio: 'khayr' };
}
export const setFajr = (s: FajrSettings) => setJSON('fajr', s);

export const getBlockEnabled = () => getJSON<boolean>('blockEnabled', true);
export const setBlockEnabled = (v: boolean) => setJSON('blockEnabled', v);

/** Rappels de prière : « complet » (10 min avant, à l'heure, +15, +30) ou « essentiel » (à l'heure seulement). */
export type NotifStyle = 'complet' | 'essentiel';
export const getNotifStyle = () => getJSON<NotifStyle>('notifStyle', 'complet');
export const setNotifStyle = (v: NotifStyle) => setJSON('notifStyle', v);

/** Meilleure série depuis un an. */
export async function bestStreak() {
  let best = 0, cur = 0;
  for (let i = 365; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const n = (await getDayLogs(todayKey(d))).length;
    if (n >= PRAYERS.length) { cur++; best = Math.max(best, cur); } else if (i !== 0) cur = 0;
  }
  return best;
}

/** Nombre de prières validées pour chaque jour du mois en cours (null = jour à venir). */
export async function monthStats() {
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const out: (number | null)[] = [];
  for (let d = 1; d <= days; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d);
    out.push(date > now ? null : (await getDayLogs(todayKey(date))).length);
  }
  return out;
}

/** Prières validées par prière sur les 30 derniers jours. */
export async function prayerCounts() {
  const c: Record<string, number> = {};
  for (const p of PRAYERS) c[p.key] = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    for (const l of await getDayLogs(todayKey(d))) c[l.prayer] = (c[l.prayer] ?? 0) + 1;
  }
  return c as Record<PrayerKey, number>;
}

/** Session Focus en cours : heure de fin (ms) et durée (min). */
/** level : difficulté figée au début de la session (on ne peut pas la baisser en cours de route). */
export type FocusSession = { endAt: number; minutes: number; pauseUntil?: number; pauses?: number; level?: FocusLevelKey };
/** Difficulté pour prendre une pause ou arrêter une session Focus. */
export type FocusLevelKey = 'facile' | 'moyen' | 'difficile';
export type FocusLevel = { key: FocusLevelKey; label: string; verses: number; perVerse: number; wait: number };
export const FOCUS_LEVELS: Record<FocusLevelKey, FocusLevel> = {
  facile: { key: 'facile', label: 'Facile', verses: 3, perVerse: 8, wait: 0 },
  moyen: { key: 'moyen', label: 'Moyen', verses: 5, perVerse: 10, wait: 30 },
  difficile: { key: 'difficile', label: 'Difficile', verses: 10, perVerse: 15, wait: 60 },
};
export async function getFocusLevel(): Promise<FocusLevel> {
  const k = await getJSON<string>('focusLevel', 'moyen');
  return FOCUS_LEVELS[k as FocusLevelKey] ?? FOCUS_LEVELS.moyen;
}
export const setFocusLevel = (k: FocusLevelKey) => setJSON('focusLevel', k);
/** « 5 versets + 30 s d'attente » */
export const levelText = (l: FocusLevel) => `${l.verses} versets${l.wait ? ` + ${l.wait} s d'attente` : ''}`;

export const getFocusSession = () => getJSON<FocusSession | null>('focus', null);
export const setFocusSession = (f: FocusSession | null) => setJSON('focus', f);

/** Noor Filter : alerte si le filtre est coupé, dernier état vu. */
export type TaqwaSettings = { alert: boolean; lastOk: boolean; days: number; since?: string };
export const getTaqwa = () => getJSON<TaqwaSettings>('taqwa', { alert: true, lastOk: false, days: 0 });
export const setTaqwa = (t: TaqwaSettings) => setJSON('taqwa', t);

/** Tahajjud : heure du réveil en minutes après minuit, rappel actif ou non. */
export type TahajjudSettings = { minutes: number | null; on: boolean };
export const getTahajjud = () => getJSON<TahajjudSettings>('tahajjud', { minutes: null, on: false });
export const setTahajjud = (t: TahajjudSettings) => setJSON('tahajjud', t);

/** Dernière lecture du Coran. */
export type ReadingPos = { kind: 'surah' | 'juz'; n: number; ayah: number; title: string; ar?: string; total?: number };
export const getReading = () => getJSON<ReadingPos | null>('reading', null);
export const setReading = (r: ReadingPos) => setJSON('reading', r);
