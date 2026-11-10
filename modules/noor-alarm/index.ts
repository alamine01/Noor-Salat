import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type NoorAlarmNative = {
  isSupported(): boolean;
  authorizationStatus(): 'authorized' | 'denied' | 'notDetermined' | 'unavailable';
  requestAuthorization(): Promise<boolean>;
  /** Renvoie l'identifiant du réveil, ou null en cas d'échec. */
  schedule(atMs: number, title: string, buttonLabel: string, sound: string | null): Promise<string | null>;
  cancelAll(): void;
  stopAll(): void;
};

/** Réveils AlarmKit (iPhone, iOS 26+). null ailleurs (Android, web, Expo Go). */
export const NoorAlarm: NoorAlarmNative | null =
  Platform.OS === 'ios' ? requireOptionalNativeModule<NoorAlarmNative>('NoorAlarm') : null;
