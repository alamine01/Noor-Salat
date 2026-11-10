import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { iosFilterActive, iosSetFilter, screenTimeStatus } from './ios';

/**
 * Engagement Taqwa (iPhone) : le filtre reste actif pendant N jours, sans bouton pour le couper.
 * Pour annuler avant la fin : lire une page du Coran, puis attendre 3 heures. Pendant ces 3 heures,
 * on peut revenir sur sa décision (« Je reste engagé »).
 * Limite honnête : on peut toujours retirer l'accès Temps d'écran dans les réglages d'iOS ;
 * l'appli le remarque et le compte comme « engagement rompu ».
 */
export const GOALS = [3, 7, 14, 30, 40];
export const MAX_DAYS = 365;
export const CANCEL_DELAY_H = 3;
const DAY = 86_400_000;
const KEY = 'taqwa:engagement';
const HIST = 'taqwa:history';
const NOTIF = 'taqwa-cancel';

export type Engagement = { start: string; days: number; intention?: string; cancelAt?: string };
export type EngagementEnd = { start: string; days: number; end: string; result: 'tenu' | 'annule' | 'rompu' };

export async function getEngagement(): Promise<Engagement | null> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null'); } catch { return null; }
}
const save = (e: Engagement | null) => (e ? AsyncStorage.setItem(KEY, JSON.stringify(e)) : AsyncStorage.removeItem(KEY));

export async function getHistory(): Promise<EngagementEnd[]> {
  try { return JSON.parse((await AsyncStorage.getItem(HIST)) ?? '[]'); } catch { return []; }
}
async function close(e: Engagement, result: EngagementEnd['result']) {
  const h = await getHistory();
  h.unshift({ start: e.start, days: e.days, end: new Date().toISOString(), result });
  await AsyncStorage.setItem(HIST, JSON.stringify(h.slice(0, 50)));
  await save(null);
  await Notifications.cancelScheduledNotificationAsync(NOTIF).catch(() => {});
}

/** Où en est l'engagement : jour en cours (1…N), date de fin, et fin d'annulation éventuelle. */
export function engagementInfo(e: Engagement, now = Date.now()) {
  const start = new Date(e.start).getTime();
  const end = start + e.days * DAY;
  return {
    day: Math.min(e.days, Math.floor((now - start) / DAY) + 1),
    end: new Date(end),
    progress: Math.min(1, Math.max(0, (now - start) / (end - start))),
    done: now >= end,
    cancelAt: e.cancelAt ? new Date(e.cancelAt) : null,
  };
}

/** Commence un engagement : active le filtre d'Apple. false si l'autorisation Temps d'écran manque. */
export async function startEngagement(days: number, intention?: string) {
  days = Math.max(1, Math.min(MAX_DAYS, Math.round(days)));
  const ok = await iosSetFilter(true);
  if (!ok) return false;
  await save({ start: new Date().toISOString(), days, intention: intention?.trim() || undefined });
  return true;
}

/** Page du Coran lue : le filtre se coupera dans 3 heures (sauf si l'on revient sur sa décision). */
export async function requestCancel() {
  const e = await getEngagement();
  if (!e) return;
  const at = new Date(Date.now() + CANCEL_DELAY_H * 3_600_000);
  await save({ ...e, cancelAt: at.toISOString() });
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF,
    content: { title: 'Noor Filter', body: 'Les 3 heures sont passées. Ouvre Noor Salat pour couper le filtre, ou reste engagé.', data: { url: 'noorsalat://taqwa' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
  }).catch(() => {});
}

/** « Je reste engagé » : on annule l'annulation. */
export async function keepEngagement() {
  const e = await getEngagement();
  if (!e) return;
  await save({ ...e, cancelAt: undefined });
  await Notifications.cancelScheduledNotificationAsync(NOTIF).catch(() => {});
}

/**
 * À appeler à l'ouverture (Accueil, Taqwa) : termine l'engagement s'il est arrivé au bout,
 * coupe le filtre si les 3 heures d'annulation sont passées, et repère un filtre retiré dans les réglages.
 */
export async function settleEngagement(): Promise<EngagementEnd['result'] | null> {
  const e = await getEngagement();
  if (!e) return null;
  const info = engagementInfo(e);
  if (info.done) { await close(e, 'tenu'); return 'tenu'; }
  if (info.cancelAt && info.cancelAt.getTime() <= Date.now()) {
    await iosSetFilter(false).catch(() => false);
    await close(e, 'annule');
    return 'annule';
  }
  // Filtre absent alors que l'engagement court : accès Temps d'écran retiré (ou filtre coupé ailleurs).
  if (screenTimeStatus() !== 'approved' || !iosFilterActive()) {
    // Si l'accès est toujours là, on remet simplement le filtre.
    if (screenTimeStatus() === 'approved' && (await iosSetFilter(true).catch(() => false))) return null;
    await close(e, 'rompu');
    return 'rompu';
  }
  return null;
}
