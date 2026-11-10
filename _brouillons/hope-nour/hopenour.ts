/**
 * Association Hope Nour : réglages lus à distance (Firestore `config/hopenour`).
 *
 * Tant que l'association n'est pas légalisée, `donsActifs` reste à false : la page présente
 * Hope Nour et annonce « Dons bientôt disponibles », sans aucun paiement.
 * Le jour où le récépissé et la page de dons sont prêts, il suffit de mettre dans Firestore :
 *   donsActifs: true, lienDon: "https://…"
 * Le bouton apparaît chez tout le monde, sans nouveau build.
 *
 * Le don s'ouvre toujours dans le navigateur (jamais de paiement dans l'appli).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from './firebase';

export type HopeNourConfig = {
  donsActifs: boolean;
  lienDon: string;   // page de dons de l'association (Wave, Orange Money, carte)
  whatsapp: string;  // numéro au format international, ex. 221771234567
  email: string;
  site: string;
};

export const HOPE_NOUR_DEFAUT: HopeNourConfig = { donsActifs: false, lienDon: '', whatsapp: '', email: '', site: '' };

const KEY = 'noor.hopenour.config';

/** Dernière configuration connue (gardée sur le téléphone pour l'affichage hors ligne). */
export async function hopeNourCache(): Promise<HopeNourConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...HOPE_NOUR_DEFAUT, ...JSON.parse(raw) } : HOPE_NOUR_DEFAUT;
  } catch { return HOPE_NOUR_DEFAUT; }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Va chercher la configuration en ligne ; en cas d'échec, renvoie le cache. */
export async function loadHopeNour(): Promise<HopeNourConfig> {
  const cached = await hopeNourCache();
  const db = firestoreDb();
  if (!db) return cached;
  try {
    const snap = await getDoc(doc(db, 'config', 'hopenour'));
    if (!snap.exists()) return cached;
    const d = snap.data();
    const lienDon = str(d.lienDon);
    const cfg: HopeNourConfig = {
      // Les dons ne s'affichent que s'il y a vraiment un lien https.
      donsActifs: d.donsActifs === true && lienDon.startsWith('https://'),
      lienDon,
      whatsapp: str(d.whatsapp).replace(/[^0-9]/g, ''),
      email: str(d.email),
      site: str(d.site).startsWith('https://') ? str(d.site) : '',
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(cfg)).catch(() => {});
    return cfg;
  } catch { return cached; }
}
