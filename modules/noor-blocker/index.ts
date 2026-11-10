import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type NoorBlockerNative = {
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): void;
  scheduleAlarm(id: number, atMs: number, kind: 'block' | 'fajr', maxMinutes: number): void;
  cancelAlarm(id: number): void;
  startGuard(kind: 'block' | 'fajr' | 'focus', maxMinutes: number): void;
  stopGuard(): void;
  isGuardActive(): boolean;
  pendingKind(): string | null;
  getForegroundApp(): string | null;
  // Ajouts design v4 (absents d'un ancien APK : toujours vérifier avant d'appeler).
  isIgnoringBatteryOptimizations?(): boolean;
  openBatterySettings?(): void;
  getPrivateDnsHost?(): string | null;
  openNetworkSettings?(): void;
  cancelAllAlarms?(): void;
  setAlarmSound?(uri: string | null): void;
  stopAlarmSound?(): void;
  isAlarmSounding?(): boolean;
};

/** null sur iOS et sur le web : le blocage réel n'existe que sur Android. */
export const NoorBlocker: NoorBlockerNative | null =
  Platform.OS === 'android' ? requireOptionalNativeModule<NoorBlockerNative>('NoorBlocker') : null;
