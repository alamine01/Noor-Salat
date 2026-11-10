/**
 * iPhone : blocage des applis avec Temps d'écran (Screen Time / Family Controls),
 * réveil Fajr avec AlarmKit (iOS 26+) et filtre web intégré d'Apple.
 *
 * Fonctionnement du blocage :
 *  - l'utilisateur choisit une fois les applis à bloquer (liste Apple, gardée sous SELECTION_ID) ;
 *  - pour chaque prière des prochains jours, on programme une « activité » Screen Time :
 *    à son début, iOS bloque la sélection (même appli fermée) ; à sa fin, iOS la débloque ;
 *  - le scan du tapis débloque tout de suite.
 * Limite d'Apple : 20 activités en même temps → 3 jours d'avance (reprogrammés à chaque ouverture).
 */
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as SALib from 'react-native-device-activity';

// Chargés dynamiquement : seulement sur iOS physique (module natif absent sur Android, web et Expo Go).
let _SA: typeof SALib | null | undefined;
function SA(): typeof SALib {
  if (_SA === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _SA = isIOS && !inExpoGo ? safe(() => require('react-native-device-activity') as typeof SALib, null) : null;
  }
  return _SA as typeof SALib;
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PrayerKey } from './prayer';
import { NoorAlarm } from '../../modules/noor-alarm';
import { shieldTexts } from './rappels';

export const isIOS = Platform.OS === 'ios';
/** Dans Expo Go, les modules natifs de Temps d'écran et d'AlarmKit n'existent pas : on ne les charge pas. */
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const SELECTION_ID = 'noor-applis';
const PREFIX = 'noor-';
const BLOCK_MINUTES = 60;

const safe = <T>(f: () => T, def: T): T => { try { return f(); } catch { return def; } };

/* ---------- Autorisation et choix des applis ---------- */

/** Temps d'écran disponible (iOS 16+ et appli construite avec l'autorisation Family Controls). */
export const screenTimeAvailable = () => isIOS && safe(() => SA().isAvailable(), false);

export type ScreenTimeStatus = 'approved' | 'denied' | 'notDetermined' | 'unavailable';
export function screenTimeStatus(): ScreenTimeStatus {
  if (!screenTimeAvailable()) return 'unavailable';
  const s = safe(() => SA().getAuthorizationStatus(), 0 as number);
  return s === 2 ? 'approved' : s === 1 ? 'denied' : 'notDetermined';
}

export async function requestScreenTime() {
  if (!screenTimeAvailable()) return 'unavailable' as const;
  try { await SA().requestAuthorization('individual'); } catch {}
  return screenTimeStatus();
}

/* Le choix d'applis (jeton opaque d'Apple) est gardé à deux endroits : dans la bibliothèque (lu par
   les extensions qui bloquent) et chez nous, en secours. Si la bibliothèque l'a perdu, on le lui rend. */
const SEL_KEY = 'ios:selection';
let selToken: string | null = null;
export async function loadSelection() {
  if (!isIOS) return;
  selToken = await AsyncStorage.getItem(SEL_KEY).catch(() => null);
  if (selToken && !countOf({ activitySelectionId: SELECTION_ID })) {
    safe(() => SA().setFamilyActivitySelectionId({ id: SELECTION_ID, familyActivitySelection: selToken! }), undefined);
  }
}
export const savedSelection = () => selToken;

/** Ce que la liste d'Apple a renvoyé (pour le diagnostic). */
export const pickerLog = { events: 0, last: 'aucun retour' };

/** Nouveau choix venant de la liste d'Apple. Un retour vide n'efface pas le choix déjà enregistré
 *  (la liste en renvoie un à son ouverture, avant d'avoir chargé le choix existant). */
export function saveSelection(token: string | null, meta?: { applicationCount?: number; categoryCount?: number; webDomainCount?: number }) {
  pickerLog.events++;
  pickerLog.last = `${meta?.applicationCount ?? '?'} applis, ${meta?.categoryCount ?? '?'} catégories, jeton ${token ? token.length + ' car.' : 'vide'}`;
  if (!token) return;
  selToken = token;
  safe(() => SA().setFamilyActivitySelectionId({ id: SELECTION_ID, familyActivitySelection: token }), undefined);
  AsyncStorage.setItem(SEL_KEY, token).catch(() => {});
}

function countOf(input: { activitySelectionId: string } | { activitySelectionToken: string }) {
  const m = safe(() => SA().activitySelectionMetadata(input as never), undefined) as Record<string, unknown> | undefined;
  if (!m) return 0;
  // Attention : le module natif renvoie « webdomainCount » (d minuscule), pas « webDomainCount » comme
  // l'annoncent ses types. Lire le mauvais nom donnait NaN, donc « rien de choisi », donc aucun blocage.
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return num(m.applicationCount) + num(m.categoryCount) + num(m.webdomainCount ?? m.webDomainCount);
}

/** Nombre d'applis, catégories et sites choisis (0 si rien). */
export function selectionCount() {
  if (!screenTimeAvailable()) return 0;
  const n = countOf({ activitySelectionId: SELECTION_ID });
  if (n || !selToken) return n;
  // La bibliothèque a perdu le choix : on le lui rend depuis notre copie.
  safe(() => SA().setFamilyActivitySelectionId({ id: SELECTION_ID, familyActivitySelection: selToken! }), undefined);
  return countOf({ activitySelectionToken: selToken });
}

/* ---------- Écrans de blocage (dessinés par iOS) ---------- */

// Style « L'heure en grand » : fond nuit plein, titre doré, texte clair, gros bouton doré.
const GOLD = { red: 226, green: 192, blue: 141 };
const GOLD_BRIGHT = { red: 243, green: 217, blue: 164 };
const NIGHT = { red: 16, green: 20, blue: 31 };
const DIM = { red: 163, green: 169, blue: 182 };
const SUB = { red: 222, green: 225, blue: 232 };

/** Symbole iOS de chaque prière : la course du soleil, du lever à la nuit. */
const PRAYER_ICON: Record<PrayerKey, string> = {
  Fajr: 'sun.horizon.fill', Dhuhr: 'sun.max.fill', Asr: 'sun.min.fill', Maghrib: 'sunset.fill', Isha: 'moon.stars.fill',
};
const PRAYER_FR: Record<PrayerKey, string> = { Fajr: 'Fajr', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha' };
const SCAN = 'Scanne ton tapis pour débloquer tes applis.';

/** Écran affiché par iOS sur les applis bloquées. Le bouton envoie une notification qui ouvre Noor Salat. */
function shield(id: string, o: { title: string; subtitle: string; icon: string; button: string; notif: { title: string; body: string; url: string } }) {
  SA().updateShieldWithId(
    {
      title: o.title, subtitle: o.subtitle,
      iconSystemName: o.icon, iconTint: GOLD_BRIGHT,
      // Fond plein, sans flou : sinon l'appli bloquée transparaît et le texte devient flou.
      backgroundColor: NIGHT,
      titleColor: GOLD_BRIGHT, subtitleColor: SUB,
      primaryButtonLabel: o.button, primaryButtonBackgroundColor: GOLD, primaryButtonLabelColor: NIGHT,
      secondaryButtonLabel: 'Fermer', secondaryButtonLabelColor: DIM,
    },
    {
      primary: { behavior: 'defer', actions: [{ type: 'sendNotification', payload: {
        // Même identifiant à chaque appui : la nouvelle notification REMPLACE l'ancienne au lieu de s'empiler.
        identifier: shieldNotifId(o.notif.url), threadIdentifier: 'noor-shield',
        title: o.notif.title, body: o.notif.body, sound: 'default', interruptionLevel: 'active', userInfo: { url: o.notif.url },
      } as never }] },
      secondary: { behavior: 'close' },
    },
    id,
  );
}

/** Identifiant des notifications envoyées par l'écran Apple (une seule par type). */
export const SHIELD_NOTIFS = ['noor-shield-block', 'noor-shield-fajr', 'noor-shield-focus'];
const shieldNotifId = (url: string) => (url.includes('fajr') ? SHIELD_NOTIFS[1] : url.includes('focus') ? SHIELD_NOTIFS[2] : SHIELD_NOTIFS[0]);

const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Écran d'une prière précise : « Asr · 15:08 », avec son symbole. */
function prayerShield(id: string, p: PrayerKey, time: string) {
  shield(id, {
    title: `${PRAYER_FR[p]} · ${time}`,
    subtitle: `L'adhan a retenti il y a 5 minutes.\n{rappel_priere}\n\n${SCAN}`,
    icon: PRAYER_ICON[p], button: 'Je vais prier',
    notif: { title: `${PRAYER_FR[p]} · ${time}`, body: 'Touche ici pour scanner ton tapis.', url: 'noorsalat://block' },
  });
}
function fajrShield(id: string, time: string) {
  shield(id, {
    title: time ? `Fajr · ${time}` : 'Réveil Fajr',
    subtitle: `« La prière vaut mieux que le sommeil. »\n\n${SCAN}`,
    icon: PRAYER_ICON.Fajr, button: 'Je me lève',
    notif: { title: 'Réveil Fajr', body: 'Touche ici pour scanner ton tapis.', url: 'noorsalat://fajr-ring' },
  });
}
function focusShield(end: Date | null) {
  shield('focus', {
    title: end ? `Focus jusqu'à ${hm(end)}` : 'Session Focus',
    subtitle: '{rappel_focus}\n\nTes applis reviennent à la fin de la session.',
    icon: 'moon.fill', button: 'Ouvrir Noor Salat',
    notif: { title: 'Session Focus', body: 'Touche ici pour voir le temps restant.', url: 'noorsalat://focus' },
  });
}

function setupShields() {
  // Rappels tirés au hasard par l'écran Apple à chaque affichage ({rappel_priere}, {rappel_focus}).
  safe(() => SA().userDefaultsSet('noor_rappels_priere', shieldTexts('priere')), undefined);
  safe(() => SA().userDefaultsSet('noor_rappels_focus', shieldTexts('focus')), undefined);
  // Écrans génériques (test, secours) ; chaque blocage programmé a en plus le sien, avec l'heure.
  shield('priere', { title: "C'est l'heure de prier", subtitle: `{rappel_priere}\n\n${SCAN}`, icon: 'sun.max.fill', button: 'Je vais prier',
    notif: { title: 'Noor Salat', body: 'Touche ici pour scanner ton tapis.', url: 'noorsalat://block' } });
  fajrShield('fajr', '');
  focusShield(null);
}

/* ---------- Programmation ---------- */

const comp = (d: Date) => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), second: 0 });
const stamp = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
export const prayerActivity = (d: Date, p: PrayerKey) => `${PREFIX}priere-${stamp(d)}-${p}`;
export const fajrActivity = (d: Date) => `${PREFIX}fajr-${stamp(d)}`;
const FOCUS = `${PREFIX}focus`;
const FOCUS_RESUME = `${PREFIX}focus-reprise`; // remet le blocage à la fin d'une pause Focus

/** Une activité Screen Time : bloque la sélection de `start` à `end` (même appli fermée). */
async function scheduleBlock(name: string, start: Date, end: Date, shieldId: string) {
  SA().configureActions({ activityName: name, callbackName: 'intervalDidStart', actions: [{ type: 'blockSelection', familyActivitySelectionId: SELECTION_ID, shieldId }] });
  SA().configureActions({ activityName: name, callbackName: 'intervalDidEnd', actions: [{ type: 'unblockSelection', familyActivitySelectionId: SELECTION_ID }] });
  await SA().startMonitoring(name, { intervalStart: comp(start), intervalEnd: comp(end), repeats: false }, []);
}

export type IosPlan = { day: Date; times: Record<PrayerKey, string>; fajrAt: Date | null; skip: PrayerKey[] }[];

/**
 * Programme le blocage iOS (prières + réveil Fajr) pour les jours donnés.
 * Ne fait rien si l'autorisation ou la liste d'applis manque.
 */
export async function scheduleIosBlocking(plan: IosPlan, opts: { block: boolean; fajr: boolean }) {
  if (screenTimeStatus() !== 'approved') return;
  const now = Date.now();
  // Blocages EN COURS (on est dans leur créneau) : surtout ne pas les arrêter. Arrêter une activité
  // en cours fait appeler sa fin par iOS, donc « débloquer » : ouvrir Noor Salat pendant la prière
  // (bouton « Je vais prier ») libérait les applis sans scan. Seul le scan ou la fin du créneau débloque.
  const running = new Set<string>();
  for (const { day, times, fajrAt } of plan) {
    for (const p of ['Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerKey[]) {
      const [h, m] = times[p].split(':').map(Number);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m + 5).getTime();
      if (now >= start - 60_000 && now < start + BLOCK_MINUTES * 60_000) running.add(prayerActivity(day, p));
    }
    if (fajrAt && now >= fajrAt.getTime() - 60_000 && now < fajrAt.getTime() + 90 * 60_000) running.add(fajrActivity(fajrAt));
  }
  // On arrête nos anciennes activités, sauf le Focus et les blocages en cours.
  const old = safe(() => SA().getActivities(), [] as string[]).filter((a) => a.startsWith(PREFIX) && a !== FOCUS && a !== FOCUS_RESUME && !running.has(a));
  if (old.length) safe(() => SA().stopMonitoring(old), undefined);
  if (!selectionCount()) return;
  setupShields();

  let count = running.size;
  for (const { day, times, fajrAt, skip } of plan.slice(0, 3)) {
    if (opts.block) {
      for (const p of ['Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerKey[]) {
        if (skip.includes(p) || count >= 18) continue;
        const [h, m] = times[p].split(':').map(Number);
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m + 5);
        if (start.getTime() <= now + 60_000) continue;
        const sid = `priere-${stamp(day)}-${p}`;
        safe(() => prayerShield(sid, p, times[p]), undefined);
        await scheduleBlock(prayerActivity(day, p), start, new Date(start.getTime() + BLOCK_MINUTES * 60_000), sid).catch(() => {});
        count++;
      }
    }
    if (opts.fajr && fajrAt && fajrAt.getTime() > now + 60_000 && count < 19) {
      const fid = `fajr-${stamp(fajrAt)}`;
      safe(() => fajrShield(fid, times.Fajr), undefined);
      await scheduleBlock(fajrActivity(fajrAt), fajrAt, new Date(fajrAt.getTime() + 90 * 60_000), fid).catch(() => {});
      count++;
    }
  }
}

/** Scan validé : on débloque tout de suite et on annule le blocage prévu pour cette prière aujourd'hui. */
export function iosUnlock(prayer?: PrayerKey) {
  if (!screenTimeAvailable()) return;
  // Une session Focus en cours garde ses applis en pause.
  const focusOn = safe(() => SA().getActivities(), [] as string[]).includes(FOCUS);
  if (!focusOn) safe(() => SA().unblockSelection({ activitySelectionId: SELECTION_ID }, 'scan'), undefined);
  const names = [fajrActivity(new Date())];
  if (prayer) names.push(prayerActivity(new Date(), prayer));
  safe(() => SA().stopMonitoring(names), undefined);
}

/** Bouton « Tester le blocage » : bloque tout de suite, jusqu'au scan. */
export function iosTestBlock() {
  if (screenTimeStatus() !== 'approved' || !selectionCount()) return false;
  setupShields();
  safe(() => SA().useShieldWithId('priere'), undefined); // n'est pas un « hook » React : copie l'écran choisi
  safe(() => SA().blockSelection({ activitySelectionId: SELECTION_ID }, 'test'), undefined);
  return true;
}

/** Diagnostic (Réglages) : l'état réel du blocage, pour comprendre ce qui ne marche pas. */
export function iosDiagnostic() {
  const last = safe(() => SA().userDefaultsGet<Record<string, unknown>>('lastBlockUpdate'), undefined);
  return {
    module: screenTimeAvailable(),
    status: screenTimeStatus(),
    selection: selectionCount(),
    picker: `${pickerLog.events} retour(s) · ${pickerLog.last}`,
    saved: selToken ? `oui (${selToken.length} car.)` : 'non',
    activities: safe(() => SA().getActivities().filter((a) => a.startsWith(PREFIX)).length, -1),
    names: safe(() => SA().getActivities().filter((a) => a.startsWith(PREFIX)).map((a) => a.slice(PREFIX.length)), [] as string[]),
    shieldActive: safe(() => SA().isShieldActive(), false),
    lastBlock: last ? `${String(last.triggeredBy ?? '')} · ${String(last.blockedAt ?? '').slice(11, 19)} · ${String(last.blocklistAppCount ?? 0)} applis, ${String(last.blocklistCategoryCount ?? 0)} catégories` : 'aucun',
  };
}

/** Débloque tout (bouton du diagnostic). */
export function iosUnblockAll() {
  safe(() => SA().unblockSelection({ activitySelectionId: SELECTION_ID }, 'diagnostic'), undefined);
  safe(() => SA().resetBlocks('diagnostic'), undefined);
}

/* ---------- Focus ---------- */

export async function iosStartFocus(minutes: number) {
  if (screenTimeStatus() !== 'approved' || !selectionCount()) return false;
  setupShields();
  safe(() => focusShield(new Date(Date.now() + minutes * 60_000)), undefined);
  safe(() => SA().useShieldWithId('focus'), undefined);
  safe(() => SA().blockSelection({ activitySelectionId: SELECTION_ID }, 'focus'), undefined);
  // iOS demande au moins 15 min entre le début et la fin d'une activité.
  const start = new Date(Date.now() + 5_000);
  const end = new Date(start.getTime() + Math.max(15, minutes) * 60_000);
  await scheduleBlock(FOCUS, start, end, 'focus').catch(() => {});
  return true;
}

/**
 * Pause Focus : les applis reviennent tout de suite, et iOS remet le blocage tout seul à la fin
 * de la pause (même appli fermée), grâce à une activité « reprise ». iOS impose 15 min minimum
 * par activité : la reprise peut donc durer après la fin de la session, mais la fin de la session
 * débloque de toute façon.
 */
export async function iosPauseFocus(pauseMin: number, sessionEnd: number) {
  if (!screenTimeAvailable()) return;
  safe(() => SA().unblockSelection({ activitySelectionId: SELECTION_ID }, 'focus-pause'), undefined);
  safe(() => SA().stopMonitoring([FOCUS_RESUME]), undefined);
  const resumeAt = new Date(Date.now() + pauseMin * 60_000);
  if (sessionEnd - resumeAt.getTime() < 60_000) return; // la session finit pendant la pause
  const end = new Date(Math.max(sessionEnd, resumeAt.getTime() + 15 * 60_000));
  await scheduleBlock(FOCUS_RESUME, resumeAt, end, 'focus').catch(() => {});
}

/** Fin de pause anticipée : on rebloque tout de suite. */
export function iosResumeFocus() {
  if (!screenTimeAvailable()) return;
  safe(() => SA().stopMonitoring([FOCUS_RESUME]), undefined);
  safe(() => SA().useShieldWithId('focus'), undefined);
  safe(() => SA().blockSelection({ activitySelectionId: SELECTION_ID }, 'focus-reprise'), undefined);
}

export function iosStopFocus() {
  if (!screenTimeAvailable()) return;
  safe(() => SA().stopMonitoring([FOCUS, FOCUS_RESUME]), undefined);
  safe(() => SA().unblockSelection({ activitySelectionId: SELECTION_ID }, 'focus-stop'), undefined);
}

/* ---------- Noor Filter (filtre web d'Apple) ---------- */

export const iosFilterActive = () => screenTimeAvailable() && safe(() => SA().isWebContentFilterPolicyActive(), false);

export async function iosSetFilter(on: boolean) {
  if ((await requestScreenTime()) !== 'approved') return false;
  safe(() => (on ? SA().setWebContentFilterPolicy({ type: 'auto' }, 'taqwa') : SA().clearWebContentFilterPolicy('taqwa')), undefined);
  return iosFilterActive();
}

/* ---------- Vrais réveils avec AlarmKit (iOS 26+) : Fajr et Tahajjud ---------- */

// Module natif maison (modules/noor-alarm). Absent sur Android, sur le web et dans Expo Go.
export const alarmKitAvailable = () => isIOS && !!NoorAlarm && safe(() => NoorAlarm!.isSupported(), false);

export async function requestAlarmKit() {
  if (!alarmKitAvailable()) return false;
  try { return await NoorAlarm!.requestAuthorization(); } catch { return false; }
}

export async function alarmKitAuthorized() {
  if (!alarmKitAvailable()) return false;
  return safe(() => NoorAlarm!.authorizationStatus(), 'unavailable' as const) === 'authorized';
}

export type IosAlarm = { date: Date; title: string; button: string; sound: string | null };

/** Remplace tous les réveils programmés par ceux donnés. */
export async function scheduleIosAlarms(alarms: IosAlarm[]) {
  if (!alarmKitAvailable()) return;
  safe(() => NoorAlarm!.cancelAll(), undefined);
  if (!(await alarmKitAuthorized())) return;
  for (const a of alarms) {
    if (a.date.getTime() <= Date.now() + 60_000) continue;
    await NoorAlarm!.schedule(a.date.getTime(), a.title, a.button, a.sound).catch(() => null);
  }
}

/** Arrête un réveil qui sonne (scan du tapis validé). */
export const stopIosAlarm = () => { if (alarmKitAvailable()) safe(() => NoorAlarm!.stopAll(), undefined); };

/** Essai : un vrai réveil dans un peu plus d'une minute (règle : au moins 1 min à l'avance). */
export async function testIosAlarm(sound: string | null) {
  if (!(await alarmKitAuthorized()) && !(await requestAlarmKit())) return false;
  const id = await NoorAlarm!.schedule(Date.now() + 65_000, 'Réveil Fajr · essai', 'Arrêter', sound).catch(() => null);
  return !!id;
}
