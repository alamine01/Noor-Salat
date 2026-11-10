import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mode dispense (règles, après un accouchement) et suivi du cycle.
 * TOUT reste sur le téléphone : rien n'est envoyé à Firebase, à l'admin ni au classement.
 * L'appli n'applique aucune règle religieuse : c'est l'utilisatrice qui dit quand la dispense
 * commence et finit. Les dates estimées ne sont qu'une aide.
 */
export type Gender = 'homme' | 'femme';
export type PeriodKind = 'regles' | 'nifas';
export type Period = { start: string; end?: string; kind: PeriodKind }; // jours AAAA-MM-JJ, fin incluse
export type DispenseSettings = { periods: Period[]; dhikr: boolean; predict: boolean };

const KEY = 'dispense';
const DAY = 86_400_000;

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / DAY);

export async function getGender(): Promise<Gender | null> {
  const g = await AsyncStorage.getItem('profile:gender').catch(() => null);
  return g === 'homme' || g === 'femme' ? g : null;
}
export const setGender = (g: Gender) => AsyncStorage.setItem('profile:gender', g);

export async function getDispense(): Promise<DispenseSettings> {
  try {
    const v = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
    if (v && Array.isArray(v.periods)) return { dhikr: true, predict: true, ...v };
  } catch {}
  return { periods: [], dhikr: true, predict: true };
}
const save = (s: DispenseSettings) => AsyncStorage.setItem(KEY, JSON.stringify(s));
export const setDispensePrefs = async (p: Partial<Pick<DispenseSettings, 'dhikr' | 'predict'>>) => save({ ...(await getDispense()), ...p });

/** Période en cours (sans fin), ou null. */
export const currentPeriod = (s: DispenseSettings) => s.periods.find((p) => !p.end) ?? null;

export async function isDispenseActive() {
  if ((await getGender()) !== 'femme') return false;
  return !!currentPeriod(await getDispense());
}

/** Début de la dispense (aujourd'hui, ou quelques jours plus tôt si elle a oublié de l'activer). */
export async function startDispense(kind: PeriodKind, daysAgo = 0) {
  const s = await getDispense();
  if (currentPeriod(s)) return;
  const d = new Date(); d.setDate(d.getDate() - Math.max(0, daysAgo));
  s.periods.push({ start: dayKey(d), kind });
  s.periods.sort((a, b) => a.start.localeCompare(b.start));
  await save(s);
}

/** Fin de la dispense : aujourd'hui compte encore comme jour de dispense. */
export async function endDispense() {
  const s = await getDispense();
  const p = currentPeriod(s);
  if (!p) return;
  p.end = dayKey();
  await save(s);
}

/** Décale le début de la période en cours (± jours). */
export async function shiftCurrentStart(delta: number) {
  const s = await getDispense();
  const p = currentPeriod(s);
  if (!p) return;
  const d = parse(p.start); d.setDate(d.getDate() + delta);
  if (d.getTime() > Date.now()) return;
  p.start = dayKey(d);
  await save(s);
}

export async function deletePeriod(start: string) {
  const s = await getDispense();
  await save({ ...s, periods: s.periods.filter((p) => p.start !== start) });
}

/** Tous les jours de dispense (pour la série et le Noor : jours neutres). */
export async function dispensedDays(): Promise<Set<string>> {
  const out = new Set<string>();
  if ((await getGender()) !== 'femme') return out;
  const today = dayKey();
  for (const p of (await getDispense()).periods) {
    const end = p.end ?? today;
    const n = Math.min(60, Math.max(0, diffDays(p.start, end)));
    for (let i = 0; i <= n; i++) { const d = parse(p.start); d.setDate(d.getDate() + i); out.add(dayKey(d)); }
  }
  return out;
}

/**
 * Statistiques du cycle (règles seulement, pas l'après-accouchement) :
 * durée moyenne des règles, longueur moyenne du cycle (début à début), prochaine date estimée.
 */
export function cycleStats(s: DispenseSettings) {
  const reg = s.periods.filter((p) => p.kind === 'regles').sort((a, b) => a.start.localeCompare(b.start));
  const durations = reg.filter((p) => p.end).map((p) => diffDays(p.start, p.end!) + 1).filter((n) => n > 0 && n < 20).slice(-6);
  const cycles: number[] = [];
  for (let i = 1; i < reg.length; i++) { const c = diffDays(reg[i - 1].start, reg[i].start); if (c >= 15 && c <= 60) cycles.push(c); }
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
  const duration = avg(durations);
  const cycle = avg(cycles.slice(-6));
  const last = reg[reg.length - 1];
  let next: Date | null = null;
  if (last) { next = parse(last.start); next.setDate(next.getDate() + (cycle ?? 28)); }
  return { duration, cycle, next, reliable: cycles.length >= 2, count: reg.length };
}

/** Jour N de la période en cours (1 = premier jour). */
export const currentDay = (p: Period) => diffDays(p.start, dayKey()) + 1;
