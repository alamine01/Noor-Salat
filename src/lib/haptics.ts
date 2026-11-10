import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

const web = Platform.OS === 'web';
const vib = (ms: number | number[]) => {
  try {
    if (web && typeof navigator !== 'undefined' && 'vibrate' in navigator) (navigator as Navigator).vibrate(ms);
  } catch {}
};

/** Petits retours tactiles, utilisés partout dans l'appli. */
export const haptic = {
  tap: () => (web ? vib(8) : Haptics.selectionAsync().catch(() => {})),
  light: () => (web ? vib(12) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})),
  medium: () => (web ? vib(20) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})),
  heavy: () => (web ? vib(30) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {})),
  success: () => (web ? vib([40, 60, 90]) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})),
  error: () => (web ? vib([60, 40, 60]) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})),
  /** Vibration plus forte que les retours tactiles (Android). */
  buzz: (ms = 40) => (web ? vib(ms) : Vibration.vibrate(ms)),
};
