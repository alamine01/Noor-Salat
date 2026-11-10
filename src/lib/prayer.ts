import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { COUNTRIES, Country, METHOD_NAMES, countryFromTimezone, findCountry, findPlace } from './places';

export type PrayerKey = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export const PRAYERS: { key: PrayerKey; fr: string; ar: string }[] = [
  { key: 'Fajr', fr: 'Fajr', ar: 'الفجر' },
  { key: 'Dhuhr', fr: 'Dhuhr', ar: 'الظهر' },
  { key: 'Asr', fr: 'Asr', ar: 'العصر' },
  { key: 'Maghrib', fr: 'Maghrib', ar: 'المغرب' },
  { key: 'Isha', fr: 'Isha', ar: 'العشاء' },
];

export type DayTimes = {
  date: string; // AAAA-MM-JJ
  times: Record<PrayerKey, string>; // "HH:MM"
  city: string;
  hijri?: string;
  sunrise?: string;
  coords: { lat: number; lng: number };
  methodLabel?: string;
  source: 'aladhan' | 'cache' | 'exemple';
};

// Dakar par défaut si le GPS est refusé.
const DAKAR = { lat: 14.6928, lng: -17.4467 };
const FALLBACK: Record<PrayerKey, string> = { Fajr: '06:02', Dhuhr: '13:31', Asr: '16:50', Maghrib: '19:12', Isha: '20:26' };

/** Réglages de calcul pour le Sénégal : Ligue islamique mondiale (Fajr 18°, Isha 17°), Asr standard (malikite). */
export const CALC = { method: 3, school: 0, timezone: 'Africa/Dakar', label: 'Ligue islamique mondiale · Fajr 18° · Isha 17° · Asr standard (malikite)' };

/** Villes du Sénégal (compatibilité avec les anciens écrans). La liste complète est dans places.ts. */
export const CITIES = COUNTRIES[0].cities;

/** 'gps' = utiliser ma position, sinon « pays:ville » (ex. « sn:dakar »). */
export type PlaceSetting = string;
export type Adjustments = Record<PrayerKey, number>;
export const NO_ADJUST: Adjustments = { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 };
export const ADJUST_LIMIT = 10;

export async function getPlaceSetting(): Promise<PlaceSetting> {
  const v = await AsyncStorage.getItem('settings:place');
  const p = findPlace(v);
  return p ? `${p.country.code}:${p.city.key}` : 'gps';
}
export async function setPlaceSetting(v: PlaceSetting) {
  await AsyncStorage.setItem('settings:place', v);
}
export async function getAdjustments(): Promise<Adjustments> {
  try {
    const v = JSON.parse((await AsyncStorage.getItem('settings:adjust')) ?? '{}');
    const out = { ...NO_ADJUST };
    for (const p of PRAYERS) {
      const n = Number(v[p.key]);
      if (Number.isFinite(n)) out[p.key] = Math.max(-ADJUST_LIMIT, Math.min(ADJUST_LIMIT, Math.round(n)));
    }
    return out;
  } catch {
    return { ...NO_ADJUST };
  }
}
export async function setAdjustments(a: Adjustments) {
  await AsyncStorage.setItem('settings:adjust', JSON.stringify(a));
}

/** Mois de l'hégire en français. */
export const HIJRI_FR = ['Mouharram', 'Safar', 'Rabi al-awwal', 'Rabi ath-thani', 'Joumada I', 'Joumada II', 'Rajab', 'Chaabane', 'Ramadan', 'Chawwal', 'Dhou al-qi\'da', 'Dhou al-hijja'];

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Vraie position GPS (preuve du scan, etc.). Dakar si refusée. */
export async function getCoords(): Promise<{ lat: number; lng: number; fromGps: boolean }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { ...DAKAR, fromGps: false };
    const last = await Location.getLastKnownPositionAsync();
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, fromGps: true };
  } catch {
    return { ...DAKAR, fromGps: false };
  }
}

export type PrayerPlace = { lat: number; lng: number; city: string; timezone: string; method: number; school: 0 | 1; methodLabel: string };

const placeOf = (lat: number, lng: number, city: string, timezone: string, c?: Country): PrayerPlace => {
  const method = c?.method ?? CALC.method;
  const school = c?.school ?? 0;
  return { lat, lng, city, timezone, method, school, methodLabel: `${METHOD_NAMES[method] ?? 'Ligue islamique mondiale'} · Asr ${school ? 'hanafite' : 'standard'}` };
};

/** Pays de la position GPS : géocodage du téléphone (gardé en mémoire), sinon fuseau horaire. */
async function gpsCountry(lat: number, lng: number, tz: string): Promise<Country | undefined> {
  const k = `gps:country:${lat.toFixed(1)},${lng.toFixed(1)}`;
  const saved = await AsyncStorage.getItem(k).catch(() => null);
  const hasCity = await AsyncStorage.getItem('gps:city').catch(() => null);
  if (saved && hasCity) return findCountry(saved);
  try {
    const [r] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const c = findCountry(r?.isoCountryCode);
    if (r?.isoCountryCode) await AsyncStorage.setItem(k, r.isoCountryCode.toLowerCase());
    // Nom de la ville seulement (jamais les coordonnées), pour les statistiques par ville.
    const city = r?.city ?? r?.subregion ?? r?.region ?? null;
    if (city) await AsyncStorage.setItem('gps:city', r?.country ? `${city}, ${r.country}` : city);
    if (c) return c;
  } catch {}
  return countryFromTimezone(tz);
}

/** Lieu utilisé pour les horaires et la Qibla : la ville choisie dans les Réglages, ou le GPS. */
export async function getPrayerPlace(): Promise<PrayerPlace> {
  const p = findPlace(await AsyncStorage.getItem('settings:place'));
  if (p) return placeOf(p.city.lat, p.city.lng, p.city.name, p.city.tz, p.country);
  const g = await getCoords();
  if (!g.fromGps) return placeOf(DAKAR.lat, DAKAR.lng, 'Dakar (par défaut)', CALC.timezone, COUNTRIES[0]);
  let tz: string = CALC.timezone;
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || CALC.timezone; } catch {}
  return placeOf(g.lat, g.lng, 'Ta position', tz, await gpsCountry(g.lat, g.lng, tz));
}

function shift(hhmm: string, min: number) {
  if (!min) return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const t = (((h * 60 + m + min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
function applyAdjust(times: Record<PrayerKey, string>, a: Adjustments) {
  const out = { ...times };
  for (const p of PRAYERS) out[p.key] = shift(times[p.key], a[p.key]);
  return out;
}

/**
 * Heures du jour via l'API Aladhan : method=3 (Ligue islamique mondiale), school=0 (Asr standard),
 * puis l'ajustement manuel (en minutes) de chaque prière.
 */
export async function loadTodayTimes(): Promise<DayTimes> {
  return loadTimesFor(new Date());
}

/** Heures d'un jour donné (aujourd'hui ou un jour à venir), avec le même cache et les mêmes ajustements. */
export async function loadTimesFor(date: Date): Promise<DayTimes> {
  const key = todayKey(date);
  const { lat, lng, city, timezone, method, school, methodLabel } = await getPrayerPlace();
  const adjust = await getAdjustments();
  const cacheKey = `times:${key}:${lat.toFixed(3)},${lng.toFixed(3)}:m${method}s${school}`;
  const exact = await AsyncStorage.getItem(cacheKey);
  // Les heures d'un jour ne changent pas : si on les a déjà pour ce lieu, pas besoin d'internet.
  if (exact) {
    const c: DayTimes = JSON.parse(exact);
    return { ...c, city, methodLabel, times: applyAdjust(c.times, adjust) };
  }
  const cached = await AsyncStorage.getItem('times:last');
  try {
    const d = date;
    const ds = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    const url = `https://api.aladhan.com/v1/timings/${ds}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}&timezonestring=${encodeURIComponent(timezone)}`;
    const json = await (await fetch(url)).json();
    const t = json.data.timings;
    const strip = (s: string) => s.slice(0, 5);
    const hijri = json.data.date?.hijri;
    const hm = Number(hijri?.month?.number);
    // Le cache garde les heures brutes : l'ajustement est appliqué à chaque lecture.
    const raw: DayTimes = {
      date: key,
      times: { Fajr: strip(t.Fajr), Dhuhr: strip(t.Dhuhr), Asr: strip(t.Asr), Maghrib: strip(t.Maghrib), Isha: strip(t.Isha) },
      city,
      hijri: hijri ? `${Number(hijri.day)} ${HIJRI_FR[hm - 1] ?? hijri.month?.en} ${hijri.year}` : undefined,
      sunrise: t.Sunrise ? strip(t.Sunrise) : undefined,
      coords: { lat, lng },
      methodLabel,
      source: 'aladhan',
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(raw));
    if (key === todayKey()) await AsyncStorage.setItem('times:last', JSON.stringify(raw));
    return { ...raw, times: applyAdjust(raw.times, adjust) };
  } catch {
    if (cached) {
      const c: DayTimes = JSON.parse(cached);
      return { ...c, city, methodLabel, times: applyAdjust(c.times, adjust), source: 'cache' };
    }
    return { date: key, times: applyAdjust(FALLBACK, adjust), city: 'Dakar (exemple hors-ligne)', coords: DAKAR, source: 'exemple' };
  }
}

export function toDate(hhmm: string, base = new Date()) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function nextPrayer(times: Record<PrayerKey, string>, now = new Date()) {
  for (const p of PRAYERS) {
    const at = toDate(times[p.key], now);
    if (at > now) return { ...p, at };
  }
  const at = toDate(times.Fajr, now);
  at.setDate(at.getDate() + 1);
  return { ...PRAYERS[0], at };
}

/** La prière en cours : la dernière dont l'heure est passée. */
export function currentPrayer(times: Record<PrayerKey, string>, now = new Date()) {
  let cur: (typeof PRAYERS)[number] | null = null;
  for (const p of PRAYERS) if (toDate(times[p.key], now) <= now) cur = p;
  return cur;
}

export function countdown(to: Date, now = new Date()) {
  const s = Math.max(0, Math.floor((to.getTime() - now.getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
}

/** Direction de la Qibla (degrés depuis le nord). */
export function qiblaBearing(lat: number, lng: number) {
  const k = { lat: 21.4225, lng: 39.8262 };
  const r = Math.PI / 180;
  const y = Math.sin((k.lng - lng) * r);
  const x = Math.cos(lat * r) * Math.tan(k.lat * r) - Math.sin(lat * r) * Math.cos((k.lng - lng) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}

/** Prière précédente (ou Isha de la veille) : sert à remplir l'anneau de l'accueil. */
export function previousPrayerTime(times: Record<PrayerKey, string>, now = new Date()) {
  let prev: Date | null = null;
  for (const p of PRAYERS) { const t = toDate(times[p.key], now); if (t <= now) prev = t; }
  if (!prev) { prev = toDate(times.Isha, now); prev.setDate(prev.getDate() - 1); }
  return prev;
}

/** Les trois tiers de la nuit, entre le Maghrib de ce soir et le Fajr de demain. */
export function nightThirds(times: Record<PrayerKey, string>, now = new Date()) {
  const maghrib = toDate(times.Maghrib, now);
  const fajr = toDate(times.Fajr, now);
  // Après minuit et avant le Fajr, la nuit en cours a commencé la veille.
  if (now < fajr) maghrib.setDate(maghrib.getDate() - 1); else fajr.setDate(fajr.getDate() + 1);
  const len = fajr.getTime() - maghrib.getTime();
  return { maghrib, t1: new Date(maghrib.getTime() + len / 3), t2: new Date(maghrib.getTime() + (2 * len) / 3), fajr };
}

export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
