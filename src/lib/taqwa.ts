import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NoorBlocker } from '../../modules/noor-blocker';
import { getTaqwa, setTaqwa } from './store';
import { todayKey } from './prayer';

export const FILTER_DNS = 'family.cloudflare-dns.com';
const FAMILY = ['family.cloudflare-dns.com', 'family-filter-dns.cleanbrowsing.org', 'adult-filter-dns.cleanbrowsing.org', 'family.adguard-dns.com'];

/** true si l'appli peut vérifier le DNS privé (Android 9+, APK à jour). */
/** Noor Filter sur Android : mis de côté (réglage DNS manuel, trop facile à retirer). Remettre à true pour le réactiver. */
export const ANDROID_FILTER = false;
export const canCheckFilter = ANDROID_FILTER && Platform.OS === 'android' && !!NoorBlocker?.getPrivateDnsHost;

export type FilterState = 'on' | 'other' | 'off' | 'unknown';

/** Lit l'état du Noor Filter et met à jour le compteur de jours protégés. */
export async function checkFilter(): Promise<{ state: FilterState; host: string | null; days: number }> {
  if (!canCheckFilter) return { state: 'unknown', host: null, days: 0 };
  let host: string | null = null;
  try { host = NoorBlocker!.getPrivateDnsHost!() ?? null; } catch {}
  const state: FilterState = host ? (FAMILY.some((f) => host!.toLowerCase().includes(f)) ? 'on' : 'other') : 'off';
  const t = await getTaqwa();
  const ok = state === 'on';
  const since = ok ? t.since ?? todayKey() : undefined;
  const days = since ? Math.floor((Date.now() - new Date(since + 'T00:00:00').getTime()) / 86_400_000) + 1 : 0;
  // Le filtre était actif et ne l'est plus : on prévient (si l'option est activée).
  if (t.alert && t.lastOk && !ok) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Noor Filter désactivé', body: "Ton filtre de protection n'est plus actif. Touche pour le réactiver.", data: { url: 'noorsalat://taqwa' } },
      trigger: null,
    }).catch(() => {});
  }
  await setTaqwa({ ...t, lastOk: ok, since, days });
  return { state, host, days };
}
