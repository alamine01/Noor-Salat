import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

export type AndroidApp = { package: string; label: string; icon: string | null };

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
  // Choix des applis (build du 12 novembre et après).
  getLaunchableApps?(): Promise<AndroidApp[]>;
  setBlockedApps?(packages: string[]): void;
  getBlockedApps?(): string[];
  setShieldTexts?(priere: string[], focus: string[]): void;
};

/** null sur iOS et sur le web : le blocage réel n'existe que sur Android. */
export const NoorBlocker: NoorBlockerNative | null =
  Platform.OS === 'android' ? requireOptionalNativeModule<NoorBlockerNative>('NoorBlocker') : null;
