import { shieldTexts } from './rappels';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NoorBlocker } from '../../modules/noor-blocker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYERS, toDate, PrayerKey, loadTimesFor } from './prayer';
import { getAdhan, getBlockEnabled, getFajr, getDayLogs, getNotifStyle, getTahajjud } from './store';
import { SLOTS, SLOT_OFFSET, Slot, prayerMessage } from './messages';
import { iosSoundFile, prepareAlarmSound } from './alarm';
import { cycleStats, currentPeriod, getDispense, getGender, isDispenseActive } from './dispense';
import { IosPlan, iosStartFocus, iosTestBlock, iosStopFocus, iosPauseFocus, iosResumeFocus, iosUnlock, isIOS, IosAlarm, alarmKitAuthorized, scheduleIosAlarms, stopIosAlarm, scheduleIosBlocking, screenTimeStatus, selectionCount } from './ios';

export const canReallyBlock = Platform.OS === 'android' && !!NoorBlocker;

/** Le blocage des applis est-il prêt ? Android : autorisations ; iPhone : Temps d'écran + applis choisies. */
export function blockingReady() {
  if (canReallyBlock) return missingPermissions() === 0;
  if (isIOS) return screenTimeStatus() === 'approved' && selectionCount() > 0;
  return false;
}

export function permissionsStatus() {
  if (!NoorBlocker) return { usage: false, overlay: false, exact: false, battery: false };
  return {
    usage: NoorBlocker.hasUsageAccess(),
    overlay: NoorBlocker.canDrawOverlays(),
    exact: NoorBlocker.canScheduleExactAlarms(),
    battery: NoorBlocker.isIgnoringBatteryOptimizations ? NoorBlocker.isIgnoringBatteryOptimizations() : true,
  };
}

/** Nombre d'autorisations manquantes pour que le blocage marche. */
export function missingPermissions() {
  if (!NoorBlocker) return 0;
  const p = permissionsStatus();
  return [p.usage, p.overlay, p.exact, p.battery].filter((x) => !x).length;
}

const BLOCK_DELAY_MIN = 5; // blocage 5 min après l'heure de la prière
/** Rappels doux pendant la dispense (titre, texte). */
const GENTLE: [string, string][] = [
  ['Un moment pour Allah', 'SubhanAllah, Alhamdulillah, Allahu Akbar.'],
  ['Un instant de dhikr', 'Astaghfirullah. Un mot léger sur la langue, lourd dans la balance.'],
  ['Ton cœur se souvient', 'La ilaha illa Allah.'],
  ['Une invocation', 'Profite de ce moment pour faire une dou‘a.'],
  ['Le rappel apaise', 'C’est par l’évocation d’Allah que les cœurs se tranquillisent.'],
];
const FAJR_RINGS = 30; // iPhone : Fajr suivant, le réveil resonne chaque minute pendant 30 min (complété à l'ouverture)
const FAJR_RINGS_FIRST = 90; // prochain Fajr : le réveil resonne pendant tout le créneau (90 min) tant que la prière n'est pas validée
const DAYS_AHEAD = 7; // on programme une semaine d'avance : l'appli n'a pas besoin d'être ouverte chaque jour
// iPhone : 64 notifications en attente au maximum (règle d'Apple). On garde les plus proches, le reste est
// programmé à la prochaine ouverture de l'appli.
const IOS_MAX_PENDING = 60;
const slotId = (key: string, prayer: PrayerKey, slot: Slot) => `prayer-${key}-${prayer}${slot === 'at' ? '' : '-' + slot}`;

/** Identifiant stable d'une alarme : jour de l'année × 10 + n° de prière (0-4), 5 = réveil Fajr. */
const alarmId = (d: Date, slot: number) => {
  const start = new Date(d.getFullYear(), 0, 0);
  const doy = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - start.getTime()) / 86_400_000);
  return 10_000 + (d.getFullYear() % 10) * 4000 + doy * 10 + slot;
};
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

let running: Promise<void> | null = null;
let lastRun = 0;

/** Depuis l'accueil : on reprogramme au plus toutes les 30 min (les réglages, eux, reprogramment tout de suite). */
export function scheduleIfStale(todayTimes?: Record<PrayerKey, string>) {
  if (Date.now() - lastRun < 30 * 60_000) return Promise.resolve();
  return scheduleDay(todayTimes);
}

/**
 * Programme les 7 prochains jours :
 *  - Android : vraie alarme native qui lance le « gardien » (blocage) 5 min après chaque prière, et le réveil Fajr.
 *    Les alarmes sont gardées par Android et reprogrammées après un redémarrage du téléphone.
 *  - Partout : une notification à l'heure de chaque prière, le réveil Fajr et le rappel Tahajjud.
 * `todayTimes` (facultatif) évite de recharger les heures du jour.
 */
export function scheduleDay(todayTimes?: Record<PrayerKey, string>) {
  // Deux appels en même temps (accueil + réglages) : on enchaîne au lieu de mélanger.
  lastRun = Date.now();
  const run = (running ?? Promise.resolve()).then(() => scheduleWeek(todayTimes)).catch(() => {});
  running = run;
  return run;
}

async function scheduleWeek(todayTimes?: Record<PrayerKey, string>) {
  if (Platform.OS === 'web') return;
  const now = new Date();
  // Dispense (règles, après accouchement) : ni blocage, ni réveil, ni Tahajjud ; rappels doux de dhikr en option.
  const disp = await isDispenseActive();
  const dPrefs = await getDispense();
  const block = (await getBlockEnabled()) && !disp;
  const fajrRaw = await getFajr();
  const fajr = disp ? { ...fajrRaw, enabled: false } : fajrRaw;
  const tahajjudRaw = await getTahajjud();
  const tahajjud = disp ? { ...tahajjudRaw, on: false } : tahajjudRaw;
  // iPhone avec AlarmKit (iOS 26+) : vrais réveils pour le Fajr et le Tahajjud, à la place des notifications.
  const realAlarms = isIOS && (await alarmKitAuthorized());
  const iosAlarms: IosAlarm[] = [];
  const done = (await getDayLogs()).map((l) => l.prayer);

  // 1. On efface tout ce qu'on avait programmé (les heures ont pu changer : ville, ajustement…).
  const prev: string[] = JSON.parse((await AsyncStorage.getItem('sched:notifs')) ?? '[]');
  for (const id of [...prev, ...PRAYERS.map((p) => 'prayer-' + p.key), 'fajr-ring', 'tahajjud']) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  }
  if (NoorBlocker) {
    NoorBlocker.cancelAllAlarms?.();
    for (const id of [100, 101, 102, 103, 104, 200]) NoorBlocker.cancelAlarm(id); // anciennes versions de l'appli
  }
  if (fajr.enabled) await prepareAlarmSound(fajr.audio);

  const ids: string[] = [];
  const iosPlan: IosPlan = [];
  // On rassemble d'abord toutes les notifications, puis on garde les plus proches (limite iPhone).
  type Pending = { id: string; date: Date; content: Notifications.NotificationContentInput; prio: number; channel: string };
  const pending: Pending[] = [];
  const notify = async (id: string, date: Date, content: Notifications.NotificationContentInput, prio = 0, channel = 'prieres') => {
    if (date > now) pending.push({ id, date, content, prio, channel });
  };
  const style = await getNotifStyle();
  const adhan = await getAdhan();
  // Android : le son d'une notification dépend de son canal (un canal par adhan).
  const atChannel = adhan === 'none' ? 'prieres' : `adhan-${adhan}-v1`;
  const startDoy = Math.floor(now.getTime() / 86_400_000);
  let firstFajrChainDone = false;

  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 12);
    const times = d === 0 && todayTimes ? todayTimes : (await loadTimesFor(day)).times;
    const key = dayKey(day);
    let fajrForIos: Date | null = null;
    let fajrStart: Date | null = null; // début du blocage du Fajr, même s'il est déjà passé (pour ne pas l'arrêter en cours)

    for (const [i, p] of PRAYERS.entries()) {
      if (d === 0 && done.includes(p.key)) continue;
      const at = toDate(times[p.key], day);
      const blockAt = new Date(at.getTime() + BLOCK_DELAY_MIN * 60_000);
      if (NoorBlocker && block && p.key !== 'Fajr' && blockAt > now) NoorBlocker.scheduleAlarm(alarmId(day, i), blockAt.getTime(), 'block', 60);
      if (disp) {
        // Pendant la dispense : un rappel doux de dhikr à l'heure de la prière (texte discret), ou rien.
        if (dPrefs.dhikr) {
          const g = GENTLE[(startDoy + d + i) % GENTLE.length];
          await notify(slotId(key, p.key, 'at'), at, { title: g[0], body: g[1], sound: true, interruptionLevel: 'active', data: { url: 'noorsalat://adhkar' } }, 1);
        }
        continue;
      }
      // Séquence de rappels : 10 min avant, à l'heure, +15 min, +30 min (style « complet »).
      // Le réveil Fajr remplace le « 10 min avant » du Fajr.
      const slots: Slot[] = style === 'essentiel' ? ['at'] : SLOTS.filter((sl) => !(sl === 'before' && p.key === 'Fajr' && fajr.enabled));
      for (const sl of slots) {
        const m = prayerMessage(sl, p, startDoy + d, i);
        await notify(slotId(key, p.key, sl), new Date(at.getTime() + SLOT_OFFSET[sl] * 60_000), {
          title: m.title,
          body: m.body,
          sound: sl === 'at' ? (iosSoundFile(adhan) ?? true) : true,
          priority: sl === 'at' ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
          interruptionLevel: sl === 'at' || sl === 'late' ? 'timeSensitive' : 'active',
          data: { url: sl === 'before' ? 'noorsalat://home' : 'noorsalat://block' },
        }, sl === 'at' ? 2 : sl === 'late' ? 1 : 0, sl === 'at' ? atChannel : 'prieres');
      }
    }

    // Fajr déjà validé aujourd'hui : plus de réveil ni de blocage pour lui.
    if (fajr.enabled && !(d === 0 && done.includes('Fajr'))) {
      const fajrAt = toDate(times.Fajr, day);
      fajrAt.setMinutes(fajrAt.getMinutes() + fajr.offsetMin);
      fajrStart = fajrAt;
      if (fajrAt > now) {
        fajrForIos = fajrAt;
        if (NoorBlocker) NoorBlocker.scheduleAlarm(alarmId(day, 5), fajrAt.getTime(), 'fajr', 90);
        if (!realAlarms) await notify(`fajr-${key}`, fajrAt, { title: 'Réveil Fajr · الفجر', body: 'Lève-toi, la prière vaut mieux que le sommeil.', sound: iosSoundFile(fajr.audio) ?? true, interruptionLevel: 'timeSensitive', data: { url: 'noorsalat://fajr-ring' } }, 3);
      }
      if (realAlarms) {
        // AlarmKit ne sait pas « resonner tant qu'on n'a pas scanné » : chaîne de réveils, un par minute,
        // pendant tout le créneau du Fajr (90 min) pour le prochain Fajr, 30 min pour le suivant
        // (complété à chaque ouverture), un seul réveil au-delà. Arrêter un réveil n'arrête pas les
        // suivants ; seuls le scan ou les versets (prière validée) annulent la chaîne.
        // Important : on reprogramme AUSSI la suite d'une chaîne déjà commencée (sinon ouvrir l'appli
        // pendant le réveil faisait disparaître tous les réveils restants de ce matin).
        const first = !firstFajrChainDone;
        const n = first ? FAJR_RINGS_FIRST : d < 2 ? FAJR_RINGS : 1;
        const chainEnd = fajrAt.getTime() + n * 60_000;
        if (chainEnd > now.getTime()) {
          firstFajrChainDone = true;
          for (let k = 0; k < n; k++) {
            const date = new Date(fajrAt.getTime() + k * 60_000);
            if (date.getTime() <= now.getTime() + 30_000) continue;
            iosAlarms.push({
              date,
              title: k === 0 ? 'Réveil Fajr · Scanne ton tapis' : 'Fajr · Toujours pas levé ? Scanne ton tapis',
              button: 'Je me lève', sound: iosSoundFile(fajr.audio),
            });
          }
        }
      }
    }

    iosPlan.push({ day, times, fajrAt: fajrForIos, fajrStart, skip: d === 0 ? done : [] });

    // Tahajjud : l'heure choisie, chaque nuit (après minuit = nuit qui suit ce jour).
    // Le premier jour, si on est déjà après minuit, le réveil de cette nuit tombe aujourd'hui même.
    if (tahajjud.on && tahajjud.minutes != null) {
      const afterMidnight = tahajjud.minutes < 12 * 60;
      const offsets = d === 0 && afterMidnight ? [0, 1] : [afterMidnight ? 1 : 0];
      for (const o of offsets) {
        const w = new Date(day.getFullYear(), day.getMonth(), day.getDate() + o, Math.floor(tahajjud.minutes / 60), tahajjud.minutes % 60);
        if (realAlarms) iosAlarms.push({ date: w, title: 'Tahajjud · Le dernier tiers de la nuit', button: 'Je me lève', sound: null });
        else await notify(`tahajjud-${key}-${o}`, w, { title: 'Tahajjud · التهجد', body: 'Le dernier tiers de la nuit est là. Lève-toi pour prier.', sound: true, interruptionLevel: 'timeSensitive' }, 3);
      }
    }
  }

  // Dispense : rappels discrets (aucun mot explicite sur l'écran verrouillé).
  if ((await getGender()) === 'femme') {
    const cur = currentPeriod(dPrefs);
    const stats = cycleStats(dPrefs);
    if (cur) {
      // Vers la fin estimée : proposer de reprendre.
      const end = new Date(cur.start + 'T10:00:00'); end.setDate(end.getDate() + (stats.duration ?? 7));
      if (end <= now) end.setTime(now.getTime() + 86_400_000);
      await notify('dispense-fin', end, { title: 'Noor Salat', body: 'Pense à mettre à jour ta pause quand tu es prête à reprendre.', sound: true, data: { url: 'noorsalat://dispense' } }, 3);
    } else if (dPrefs.predict && stats.next) {
      const at = new Date(stats.next); at.setHours(9, 0, 0, 0);
      if (at > now) await notify('dispense-debut', at, { title: 'Noor Salat', body: 'Touche ici si tu as besoin de mettre ta pause.', sound: true, data: { url: 'noorsalat://dispense' } }, 3);
    }
  }

  // iPhone : au-delà de la limite, on garde d'abord l'heure de chaque prière et les réveils des 4 prochains jours,
  // puis les autres rappels (10 min avant, +15, +30) les plus proches. L'appli complète à chaque ouverture.
  pending.sort((x, y) => x.date.getTime() - y.date.getTime());
  let keep = pending;
  if (Platform.OS === 'ios' && pending.length > IOS_MAX_PENDING) {
    const limit = now.getTime() + 4 * 86_400_000;
    const vital = pending.filter((x) => x.prio >= 2 && x.date.getTime() < limit).slice(0, IOS_MAX_PENDING);
    const rest = pending.filter((x) => !vital.includes(x)).slice(0, IOS_MAX_PENDING - vital.length);
    keep = [...vital, ...rest];
  }
  for (const x of keep) {
    await Notifications.scheduleNotificationAsync({ identifier: x.id, content: x.content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: x.date, channelId: x.channel } })
      .then(() => ids.push(x.id)).catch(() => {});
  }
  await AsyncStorage.setItem('sched:notifs', JSON.stringify(ids));

  // iPhone : blocage Temps d'écran (3 jours d'avance, limite Apple) et réveil AlarmKit (iOS 26+).
  if (isIOS) {
    await scheduleIosBlocking(iosPlan, { block, fajr: fajr.enabled }).catch(() => {});
    await scheduleIosAlarms(iosAlarms).catch(() => {});
  }
}

/** Prière validée avant l'heure du blocage : on annule le blocage prévu pour elle aujourd'hui. */
export function cancelTodayBlock(prayer: PrayerKey) {
  if (isIOS) iosUnlock(prayer);
  const i = PRAYERS.findIndex((p) => p.key === prayer);
  if (NoorBlocker && i >= 0) NoorBlocker.cancelAlarm(alarmId(new Date(), i));
  // Prière validée : on retire aussi les rappels « +15 min » et « il y a 30 min ».
  for (const sl of SLOTS) Notifications.cancelScheduledNotificationAsync(slotId(dayKey(new Date()), prayer, sl)).catch(() => {});
}

export async function setupNotifications() {
  // Android : rappels de l'écran « appli en pause » (même liste que l'écran Apple sur iPhone).
  try { NoorBlocker?.setShieldTexts?.(shieldTexts('priere'), shieldTexts('focus')); } catch {}
  if (Platform.OS === 'web') return;
  await Notifications.requestPermissionsAsync().catch(() => {});
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prieres', {
      name: 'Prières',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    }).catch(() => {});
    // Un canal par adhan (sur Android, le son est fixé à la création du canal).
    for (const [k, name] of [['beautiful', 'Adhan']] as const) {
      await Notifications.setNotificationChannelAsync(`adhan-${k}-v1`, {
        name: `Prières · ${name}`,
        importance: Notifications.AndroidImportance.MAX,
        sound: `adhan_${k}_30.wav`,
        vibrationPattern: [0, 400, 200, 400],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }).catch(() => {});
    }
  }
}

/** Déblocage après un scan validé. */
export function unlock(prayer?: PrayerKey) {
  NoorBlocker?.stopGuard();
  if (isIOS) stopIosAlarm();
  if (isIOS) iosUnlock(prayer);
  // Fajr validé : on reprogramme tout, ce qui annule le reste de la chaîne de réveils de ce matin.
  if (isIOS && prayer === 'Fajr') scheduleDay().catch(() => {});
}

/** Pour tester le blocage tout de suite (bouton « Tester »). */
export function testBlockNow(kind: 'block' | 'fajr' = 'block') {
  NoorBlocker?.startGuard(kind, 10);
  if (isIOS) iosTestBlock();
}

/** Session Focus : met les applis en pause pendant `minutes` (Android), ou simple minuteur ailleurs. */
export async function startFocus(minutes: number) {
  const { setFocusSession, getFocusLevel } = await import('./store');
  const endAt = Date.now() + minutes * 60_000;
  await setFocusSession({ endAt, minutes, level: (await getFocusLevel()).key });
  NoorBlocker?.startGuard('focus', minutes);
  if (isIOS) await iosStartFocus(minutes);
  if (Platform.OS !== 'web') {
    await Notifications.scheduleNotificationAsync({
      identifier: 'focus-end',
      content: { title: 'Session Focus terminée', body: 'Tes applis sont de nouveau disponibles.', sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endAt), channelId: 'prieres' },
    }).catch(() => {});
  }
  return endAt;
}

/** Pauses Focus proposées (minutes). */
export const FOCUS_PAUSES = [5, 10, 15];

/** Pause pendant une session Focus : applis libres `minutes`, puis blocage remis tout seul. */
export async function pauseFocus(minutes: number) {
  const { getFocusSession, setFocusSession } = await import('./store');
  const s = await getFocusSession();
  if (!s || s.endAt <= Date.now()) return;
  const until = Math.min(s.endAt, Date.now() + Math.min(15, minutes) * 60_000);
  await setFocusSession({ ...s, pauseUntil: until, pauses: (s.pauses ?? 0) + 1 });
  if (NoorBlocker && NoorBlocker.pendingKind() === 'focus') NoorBlocker.stopGuard();
  if (isIOS) await iosPauseFocus(minutes, s.endAt);
  if (Platform.OS !== 'web' && until < s.endAt) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'focus-pause-end',
      content: { title: 'Fin de la pause', body: 'Ta session Focus reprend. Bismillah !', sound: true, data: { url: 'noorsalat://focus' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(until), channelId: 'prieres' },
    }).catch(() => {});
  }
}

/** Reprendre (avant la fin de la pause, ou à l'ouverture après). Android : relance le gardien. */
export async function resumeFocus() {
  const { getFocusSession, setFocusSession } = await import('./store');
  const s = await getFocusSession();
  if (!s) return;
  await setFocusSession({ ...s, pauseUntil: undefined });
  const left = Math.ceil((s.endAt - Date.now()) / 60_000);
  if (left > 0) NoorBlocker?.startGuard('focus', left);
  if (isIOS) iosResumeFocus();
  if (Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync('focus-pause-end').catch(() => {});
}

export async function stopFocus() {
  const { setFocusSession } = await import('./store');
  await setFocusSession(null);
  if (NoorBlocker && NoorBlocker.pendingKind() === 'focus') NoorBlocker.stopGuard();
  if (isIOS) iosStopFocus();
  if (Platform.OS !== 'web') {
    await Notifications.cancelScheduledNotificationAsync('focus-end').catch(() => {});
    await Notifications.cancelScheduledNotificationAsync('focus-pause-end').catch(() => {});
  }
}
