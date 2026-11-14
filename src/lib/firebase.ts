/**
 * Sauvegarde en ligne (Firebase). Le téléphone reste la référence : l'appli lit et écrit
 * toujours en local, puis envoie une copie quand internet est là.
 *
 * Ce qui part en ligne (et rien d'autre) :
 *  - users/{uid}            : pseudo, ville choisie, % Noor, séries, total, dates
 *  - users/{uid}/jours/{j}  : la liste des prières validées ce jour-là (sans heure, sans GPS, sans photo)
 *  - classement/{uid}       : pseudo, % Noor, série (seulement si l'utilisateur l'a choisi)
 *
 * Sans clés dans .env, tout reste sur le téléphone.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  Auth, EmailAuthProvider, User, createUserWithEmailAndPassword, deleteUser, getAuth, initializeAuth, linkWithCredential,
  onAuthStateChanged, reauthenticateWithCredential, sendPasswordResetEmail, signInAnonymously, signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  Firestore, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, serverTimestamp, setDoc, writeBatch,
} from 'firebase/firestore';
import type { PrayerKey } from './prayer';

const cfg = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = !!(cfg.apiKey && cfg.projectId && cfg.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function init() {
  if (!firebaseConfigured) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(cfg as Record<string, string>);
    if (Platform.OS === 'web') auth = getAuth(app);
    else {
      // Sur le téléphone, la session doit survivre à la fermeture de l'appli (sinon un nouvel UID à chaque fois).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getReactNativePersistence } = require('firebase/auth') as { getReactNativePersistence: (s: unknown) => never };
      try { auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); } catch { auth = getAuth(app); }
    }
    db = getFirestore(app);
  }
  return { auth: auth!, db: db! };
}

/* ---------- Préférences de sauvegarde (sur le téléphone) ---------- */

export type CloudPrefs = { sync: boolean; leaderboard: boolean; pseudo: string };
const DEFAULT_PREFS: CloudPrefs = { sync: true, leaderboard: false, pseudo: '' };

export async function getCloudPrefs(): Promise<CloudPrefs> {
  try { return { ...DEFAULT_PREFS, ...JSON.parse((await AsyncStorage.getItem('cloud')) ?? '{}') }; } catch { return DEFAULT_PREFS; }
}
export async function setCloudPrefs(p: Partial<CloudPrefs>) {
  const n = { ...(await getCloudPrefs()), ...p };
  await AsyncStorage.setItem('cloud', JSON.stringify(n));
  return n;
}

/* ---------- Compte ---------- */

/** Connexion anonyme si besoin. Renvoie null si Firebase n'est pas configuré ou si la sauvegarde est coupée. */
async function ready(force = false) {
  const f = init();
  if (!f) return null;
  if (!force && !(await getCloudPrefs()).sync) return null;
  await (f.auth as Auth & { authStateReady?: () => Promise<void> }).authStateReady?.();
  if (!f.auth.currentUser) await signInAnonymously(f.auth);
  return { user: f.auth.currentUser!, db: f.db };
}

export type AccountInfo = { configured: boolean; uid: string | null; email: string | null; anonymous: boolean };

export async function accountInfo(): Promise<AccountInfo> {
  const f = init();
  if (!f) return { configured: false, uid: null, email: null, anonymous: true };
  await (f.auth as Auth & { authStateReady?: () => Promise<void> }).authStateReady?.();
  const u = f.auth.currentUser;
  return { configured: true, uid: u?.uid ?? null, email: u?.email ?? null, anonymous: !u || u.isAnonymous };
}

export function onAccountChange(cb: (u: User | null) => void) {
  const f = init();
  if (!f) return () => {};
  return onAuthStateChanged(f.auth, cb);
}

/** Messages d'erreur Firebase en français simple. */
export function authError(e: unknown) {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('email-already-in-use')) return 'Cette adresse a déjà un compte : choisis « J’ai déjà un compte ».';
  if (code.includes('invalid-email')) return 'Adresse email invalide.';
  if (code.includes('weak-password')) return 'Mot de passe trop court (6 caractères minimum).';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Email ou mot de passe incorrect.';
  if (code.includes('too-many-requests')) return 'Trop d’essais. Réessaie dans quelques minutes.';
  if (code.includes('network')) return 'Pas de connexion internet.';
  if (code.includes('operation-not-allowed')) return 'La connexion par email n’est pas activée dans Firebase.';
  if (code.includes('requires-recent-login')) return 'Par sécurité, déconnecte-toi, reconnecte-toi, puis réessaie la suppression.';
  return 'Une erreur est survenue. Réessaie.';
}

/** Option A : le compte anonyme devient un compte email, sans rien perdre. */
export async function saveAccountWithEmail(email: string, password: string) {
  const r = await ready(true);
  if (!r) throw new Error('not-configured');
  const cred = EmailAuthProvider.credential(email.trim(), password);
  if (r.user.isAnonymous) await linkWithCredential(r.user, cred);
  else await createUserWithEmailAndPassword(init()!.auth, email.trim(), password);
  await pushAll();
}

/** Nouveau téléphone : on se connecte au compte existant, puis on récupère l'historique. */
export async function signInExisting(email: string, password: string) {
  const f = init();
  if (!f) throw new Error('not-configured');
  await signInWithEmailAndPassword(f.auth, email.trim(), password);
  const restored = await restoreFromCloud();
  await pushAll();
  return restored;
}

export async function resetPassword(email: string) {
  const f = init();
  if (!f) throw new Error('not-configured');
  await sendPasswordResetEmail(f.auth, email.trim());
}

export async function logout() {
  const f = init();
  if (!f) return;
  await signOut(f.auth);
}

/* ---------- Envoi ---------- */

async function localSnapshot() {
  const { noorPercent, streakDays, bestStreak } = await import('./store');
  const { getPlaceSetting } = await import('./prayer');
  const { findPlace } = await import('./places');
  const place = await getPlaceSetting();
  return {
    noor: await noorPercent(),
    streak: await streakDays(),
    best: await bestStreak(),
    // Ville choisie, ou ville déduite du GPS sur le téléphone (le nom seulement, jamais les coordonnées).
    city: (() => { const p = findPlace(place); return p ? `${p.city.name}, ${p.country.name}` : null; })()
      ?? (place === 'gps' ? await AsyncStorage.getItem('gps:city').catch(() => null) : null),
  };
}

/** Envoie le profil (chiffres) et met à jour le classement si l'utilisateur l'a choisi. */
let lastProfile = 0;
export async function syncProfile(opts: { throttle?: boolean } = {}) {
  if (opts.throttle && Date.now() - lastProfile < 10 * 60_000) return;
  lastProfile = Date.now();
  const r = await ready().catch(() => null);
  if (!r) return;
  const prefs = await getCloudPrefs();
  const s = await localSnapshot();
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('logs:'));
  let total = 0;
  for (const k of keys) total += JSON.parse((await AsyncStorage.getItem(k)) ?? '[]').length;
  await setDoc(doc(r.db, 'users', r.user.uid), {
    pseudo: prefs.pseudo || null, qrId: (await AsyncStorage.getItem('userId')) ?? null, city: s.city, noor: s.noor, streak: s.streak, bestStreak: s.best, totalPrieres: total,
    email: r.user.email ?? null, anonymous: r.user.isAnonymous, platform: Platform.OS,
    updatedAt: serverTimestamp(), lastSeen: serverTimestamp(),
  }, { merge: true });
  // Rattrapage : les prières validées hors ligne ces 3 derniers jours partent dès qu'internet revient.
  const { todayKey } = await import('./prayer');
  for (let i = 0; i < 3; i++) { const d = new Date(); d.setDate(d.getDate() - i); await syncDay(todayKey(d)).catch(() => {}); }
  const ref = doc(r.db, 'classement', r.user.uid);
  if (prefs.leaderboard && prefs.pseudo) await setDoc(ref, { pseudo: prefs.pseudo, noor: s.noor, streak: s.streak, updatedAt: serverTimestamp() });
  else await deleteDoc(ref).catch(() => {});
}

/** Envoie la liste des prières validées d'un jour (clé AAAA-MM-JJ). */
export async function syncDay(day: string) {
  const r = await ready().catch(() => null);
  if (!r) return;
  const { getDayLogs } = await import('./store');
  const prayers = (await getDayLogs(day)).map((l) => l.prayer);
  await setDoc(doc(r.db, 'users', r.user.uid, 'jours', day), { prayers, count: prayers.length, updatedAt: serverTimestamp() });
}

/** Envoie tout l'historique local (après création ou connexion d'un compte). */
export async function pushAll() {
  const r = await ready(true).catch(() => null);
  if (!r) return;
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('logs:'));
  let batch = writeBatch(r.db);
  let n = 0;
  for (const k of keys) {
    const prayers = (JSON.parse((await AsyncStorage.getItem(k)) ?? '[]') as { prayer: PrayerKey }[]).map((l) => l.prayer);
    if (!prayers.length) continue;
    batch.set(doc(r.db, 'users', r.user.uid, 'jours', k.slice(5)), { prayers, count: prayers.length, updatedAt: serverTimestamp() });
    if (++n % 400 === 0) { await batch.commit(); batch = writeBatch(r.db); }
  }
  await batch.commit();
  await syncProfile();
}

/** Récupère l'historique en ligne et le fusionne avec celui du téléphone. Renvoie le nombre de jours ajoutés. */
export async function restoreFromCloud() {
  const r = await ready(true).catch(() => null);
  if (!r) return 0;
  const snap = await getDocs(collection(r.db, 'users', r.user.uid, 'jours'));
  let added = 0;
  for (const d of snap.docs) {
    const day = d.id;
    const prayers = (d.data().prayers ?? []) as PrayerKey[];
    const key = 'logs:' + day;
    const local = JSON.parse((await AsyncStorage.getItem(key)) ?? '[]') as { prayer: PrayerKey }[];
    const missing = prayers.filter((p) => !local.some((l) => l.prayer === p));
    if (!missing.length) continue;
    const merged = [...local, ...missing.map((prayer) => ({ prayer, at: `${day}T12:00:00.000Z`, method: 'cloud' }))];
    await AsyncStorage.setItem(key, JSON.stringify(merged));
    added++;
  }
  const u = await getDoc(doc(r.db, 'users', r.user.uid));
  const pseudo = u.data()?.pseudo as string | undefined;
  if (pseudo) await setCloudPrefs({ pseudo });
  // On garde le même QR de tapis que sur l'ancien téléphone.
  const qrId = u.data()?.qrId as string | undefined;
  if (qrId) await AsyncStorage.setItem('userId', qrId);
  return added;
}

/** Droit à l'effacement : supprime tout ce qui est en ligne (le téléphone garde ses données). */
export async function deleteCloudData() {
  const r = await ready(true).catch(() => null);
  if (!r) return;
  const snap = await getDocs(collection(r.db, 'users', r.user.uid, 'jours'));
  let batch = writeBatch(r.db);
  let n = 0;
  for (const d of snap.docs) { batch.delete(d.ref); if (++n % 400 === 0) { await batch.commit(); batch = writeBatch(r.db); } }
  batch.delete(doc(r.db, 'classement', r.user.uid));
  batch.delete(doc(r.db, 'users', r.user.uid));
  await batch.commit();
  await setCloudPrefs({ sync: false, leaderboard: false });
}

/**
 * Suppression du compte lui-même (exigé par l'App Store dès qu'une appli permet d'en créer un).
 * Efface d'abord les documents en ligne, puis l'identifiant de connexion : l'email ne reste
 * nulle part et plus rien ne permet de relier ces données à quelqu'un.
 * Firebase refuse de supprimer un compte email connecté depuis longtemps, donc on redonne le
 * mot de passe quand on l'a (sinon l'utilisateur voit le message d'authError et se reconnecte).
 * Le téléphone garde son historique : c'est à l'utilisateur de le réinitialiser s'il le veut.
 */
export async function deleteAccount(password?: string) {
  const f = init();
  if (!f) throw new Error('not-configured');
  await (f.auth as Auth & { authStateReady?: () => Promise<void> }).authStateReady?.();
  const u = f.auth.currentUser;
  if (!u) {
    await setCloudPrefs({ sync: false, leaderboard: false });
    return;
  }
  if (u.email && password) await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
  await deleteCloudData();
  await deleteUser(u);
  await setCloudPrefs({ sync: false, leaderboard: false, pseudo: '' });
}

/* ---------- Classement ---------- */

export type Rank = { name: string; noor: number; streak: number; me?: boolean };

/** Classement réel (utilisateurs qui ont choisi d'y apparaître), sinon exemple. */
export async function loadLeaderboard(myNoor: number, myStreak: number): Promise<{ rows: Rank[]; demo: boolean }> {
  const r = await ready().catch(() => null);
  if (r) {
    try {
      const snap = await getDocs(query(collection(r.db, 'classement'), orderBy('noor', 'desc'), limit(20)));
      const rows = snap.docs.map((d) => ({ name: d.data().pseudo as string, noor: d.data().noor ?? 0, streak: d.data().streak ?? 0, me: d.id === r.user.uid }));
      if (rows.length) return { rows, demo: false };
    } catch {}
  }
  const rows: Rank[] = [
    { name: 'Aïcha', noor: 97, streak: 41 },
    { name: 'Moussa', noor: 92, streak: 23 },
    { name: 'Toi', noor: myNoor, streak: myStreak, me: true },
    { name: 'Fatou', noor: 74, streak: 9 },
    { name: 'Ibrahima', noor: 66, streak: 4 },
  ].sort((a, b) => b.noor - a.noor);
  return { rows, demo: true };
}
