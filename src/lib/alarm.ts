import { Vibration, Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { Asset } from 'expo-asset';
import { NoorBlocker } from '../../modules/noor-blocker';
import type { AdhanKey, FajrSettings } from './store';

// Sons du réveil Fajr, joués en boucle. « systeme » : la sonnerie d'alarme du téléphone (Android, AlarmKit) ;
// dans l'appli, on joue alors « As-salātu khayrun mina-n-nawm ».
export const SOURCES: Record<FajrSettings['audio'], number> = {
  khayr: require('../../assets/sounds/khayr.m4a'),
  adhan_fajr: require('../../assets/sounds/adhan_fajr.m4a'),
  systeme: require('../../assets/sounds/khayr.m4a'),
};

/** Adhans à l'heure de la prière (version complète, pour l'écoute dans l'appli). */
export const ADHANS: Record<Exclude<AdhanKey, 'none'>, number> = {
  beautiful: require('../../assets/sounds/adhan_beautiful.m4a'),
};

/** Fichier de 30 s max (règle d'Apple) utilisé par les notifications et les réveils iPhone. */
export const iosSoundFile = (k: FajrSettings['audio'] | AdhanKey) => (k === 'systeme' || k === 'none' ? null : `${k === 'khayr' || k === 'adhan_fajr' ? k : 'adhan_' + k}_30.wav`);

let player: AudioPlayer | null = null;
let ramp: ReturnType<typeof setInterval> | null = null;

/**
 * Android : copie le son choisi dans un fichier local et le donne au code natif,
 * qui le jouera lui-même au Fajr, même si l'appli est fermée.
 */
export async function prepareAlarmSound(audio: FajrSettings['audio']) {
  if (!NoorBlocker?.setAlarmSound) return;
  if (audio === 'systeme') return NoorBlocker.setAlarmSound(null); // sonnerie d'alarme du téléphone
  try {
    const a = Asset.fromModule(SOURCES[audio]);
    await a.downloadAsync();
    NoorBlocker.setAlarmSound(a.localUri ?? null);
  } catch {
    NoorBlocker.setAlarmSound(null); // le natif prendra la sonnerie d'alarme du téléphone
  }
}

/** true si Android joue déjà le réveil (lancé par l'alarme native). */
export const nativeAlarmRinging = () => !!NoorBlocker?.isAlarmSounding?.();

/** Réveil : le volume monte de 10 % à 100 % en une minute, avec vibration. */
export async function startAlarm(audio: FajrSettings['audio']) {
  if (player || nativeAlarmRinging()) return;
  await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  player = createAudioPlayer(SOURCES[audio]);
  player.loop = true;
  player.volume = 0.1;
  player.play();
  ramp = setInterval(() => {
    if (player && player.volume < 1) player.volume = Math.min(1, player.volume + 0.03);
  }, 2000);
  if (Platform.OS !== 'web') Vibration.vibrate([0, 800, 600], true);
}

/** Arrête le son (celui de l'appli et celui d'Android). */
export function stopAlarm() {
  if (ramp) clearInterval(ramp);
  ramp = null;
  Vibration.cancel();
  NoorBlocker?.stopAlarmSound?.();
  if (player) {
    player.pause();
    player.remove();
  }
  player = null;
}

export const alarmRinging = () => !!player || nativeAlarmRinging();
