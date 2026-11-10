import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYERS, PrayerKey, loadTimesFor, toDate, todayKey } from './prayer';
import type { PrayerLog } from './store';

/** Paliers de série (jours d'affilée avec les 5 prières). */
export const MILESTONES = [3, 7, 14, 30, 40, 100];

export type Progress = {
  today: PrayerKey[];                       // prières validées aujourd'hui
  noor: number; noorPrev: number;           // % sur 7 jours, et sur les 7 jours d'avant
  streak: number; best: number;
  week: { day: string; count: number }[];   // 7 derniers jours
  month: { day: number; count: number | null; today: boolean }[]; firstWeekday: number; // 0 = lundi
  perPrayer: Record<PrayerKey, number>;     // sur 30 jours
  delay: Partial<Record<PrayerKey, number>>; // minutes moyennes après l'adhan (14 jours)
  total: number;                            // prières validées sur l'année
  dhikrToday: number; dhikrWeek: number;
};

const dayOffset = (i: number) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); return d; };

/** Tout ce dont la page Progrès a besoin, en une seule lecture du téléphone. */
export async function loadProgress(): Promise<Progress> {
  const N = 366;
  const keys: string[] = [];
  for (let i = 0; i < N; i++) keys.push('logs:' + todayKey(dayOffset(i)));
  for (let i = 0; i < 7; i++) keys.push('tasbih:' + todayKey(dayOffset(i)));
  const rows = await AsyncStorage.multiGet(keys).catch(() => [] as [string, string | null][]);
  const map = new Map(rows);
  const logs = (i: number): PrayerLog[] => { try { return JSON.parse(map.get('logs:' + todayKey(dayOffset(i))) ?? '[]'); } catch { return []; } };
  const n = (i: number) => logs(i).length;

  // Séries
  let streak = 0;
  for (let i = 0; i < N; i++) { if (n(i) >= 5) streak++; else if (i === 0) continue; else break; }
  let best = 0, cur = 0;
  for (let i = N - 1; i >= 0; i--) { if (n(i) >= 5) { cur++; best = Math.max(best, cur); } else if (i !== 0) cur = 0; }

  let w = 0, wp = 0, total = 0;
  for (let i = 0; i < 7; i++) w += n(i);
  for (let i = 7; i < 14; i++) wp += n(i);
  for (let i = 0; i < N; i++) total += n(i);

  const names = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
  const week = Array.from({ length: 7 }, (_, k) => { const i = 6 - k; return { day: names[dayOffset(i).getDay()], count: n(i) }; });

  // Mois en cours, aligné sur les jours de la semaine (lundi en premier)
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const month = Array.from({ length: days }, (_, k) => {
    const d = k + 1;
    const ago = now.getDate() - d;
    return { day: d, count: ago < 0 ? null : n(ago), today: ago === 0 };
  });
  const firstWeekday = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;

  const perPrayer = Object.fromEntries(PRAYERS.map((p) => [p.key, 0])) as Record<PrayerKey, number>;
  for (let i = 0; i < 30; i++) for (const l of logs(i)) perPrayer[l.prayer] = (perPrayer[l.prayer] ?? 0) + 1;

  // Délai après l'adhan : seulement les jours où l'on a des validations (heures du jour en cache).
  const sums: Partial<Record<PrayerKey, number[]>> = {};
  await Promise.all(Array.from({ length: 14 }, async (_, i) => {
    const ls = logs(i);
    if (!ls.length) return;
    const t = await loadTimesFor(dayOffset(i)).catch(() => null);
    if (!t || t.source === 'exemple') return;
    for (const l of ls) {
      const at = new Date(l.at);
      const m = (at.getTime() - toDate(t.times[l.prayer], at).getTime()) / 60000;
      if (m >= 0 && m <= 240) (sums[l.prayer] ??= []).push(m);
    }
  }));
  const delay: Partial<Record<PrayerKey, number>> = {};
  for (const p of PRAYERS) { const a = sums[p.key]; if (a?.length) delay[p.key] = Math.round(a.reduce((x, y) => x + y, 0) / a.length); }

  const dh = (i: number) => Number(map.get('tasbih:' + todayKey(dayOffset(i)))) || 0;
  let dhikrWeek = 0;
  for (let i = 0; i < 7; i++) dhikrWeek += dh(i);

  return {
    today: logs(0).map((l) => l.prayer),
    noor: Math.round((w / 35) * 100), noorPrev: Math.round((wp / 35) * 100),
    streak, best, week, month, firstWeekday, perPrayer, delay, total,
    dhikrToday: dh(0), dhikrWeek,
  };
}
