import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T, Label } from './Text';
import { Icon } from './Icon';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { blockingReady } from '../lib/blocker';
import { todayKey } from '../lib/prayer';

/* ---------- Étapes « Premiers pas » ---------- */

type StepKey = 'qr' | 'apps' | 'scan' | 'fajr' | 'focus';
const STEPS: { key: StepKey; title: string; sub: string; href: string }[] = [
  { key: 'qr', title: 'Afficher mon QR de tapis', sub: 'L’imprimer et le coller sur ton tapis', href: '/profile' },
  { key: 'apps', title: 'Choisir les applis à mettre en pause', sub: 'Elles se bloquent à l’heure de la prière', href: '/parametres' },
  { key: 'scan', title: 'Valider une première prière', sub: 'Scanne ton tapis après avoir prié', href: '/scan' },
  { key: 'fajr', title: 'Régler mon réveil du Fajr', sub: 'Heure, son, squats', href: '/fajr' },
  { key: 'focus', title: 'Découvrir Focus', sub: 'Mettre les applis en pause pour travailler', href: '/focus' },
];

/** Marque une étape comme faite (appelée à l'ouverture de l'écran concerné). */
export const markGuide = (k: StepKey) => AsyncStorage.setItem('guide:' + k, '1').catch(() => {});

async function doneSteps(): Promise<Record<StepKey, boolean>> {
  const v = Object.fromEntries(await AsyncStorage.multiGet(STEPS.map((s) => 'guide:' + s.key)).catch(() => [])) as Record<string, string | null>; // inclut guide:apps
  let scanned = v['guide:scan'] === '1';
  if (!scanned) {
    // Une prière validée ces 30 derniers jours suffit.
    const keys = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return 'logs:' + todayKey(d); });
    const rows = await AsyncStorage.multiGet(keys).catch(() => []);
    scanned = rows.some(([, x]) => !!x && x !== '[]');
  }
  const ready = blockingReady();
  if (ready) markGuide('apps');
  return { qr: v['guide:qr'] === '1', apps: ready || v['guide:apps'] === '1', scan: scanned, fajr: v['guide:fajr'] === '1', focus: v['guide:focus'] === '1' };
}

/** Carte « Premiers pas » de l'Accueil : se coche toute seule, disparaît une fois terminée. */
export function FirstSteps() {
  const [done, setDone] = useState<Record<StepKey, boolean> | null>(null);
  const [hidden, setHidden] = useState(true);
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('guide:hidden').then((h) => setHidden(h === '1')).catch(() => setHidden(false));
    doneSteps().then(setDone).catch(() => {});
  }, []));
  if (hidden || !done) return null;
  const count = STEPS.filter((s) => done[s.key]).length;
  if (count === STEPS.length) return null;
  return (
    <View style={st.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label>Premiers pas · {count}/{STEPS.length}</Label>
        <Pressable onPress={() => { setHidden(true); AsyncStorage.setItem('guide:hidden', '1').catch(() => {}); }} hitSlop={10} accessibilityRole="button">
          <T style={{ fontSize: 12, color: C.faint }}>Masquer</T>
        </Pressable>
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 10 }}>
        <View style={{ height: 4, width: `${(count / STEPS.length) * 100}%`, backgroundColor: C.gold }} />
      </View>
      <View style={{ marginTop: 6 }}>
        {STEPS.map((s, i) => {
          const ok = done[s.key];
          return (
            <Pressable key={s.key} onPress={() => { haptic.tap(); router.push(s.href as never); }} accessibilityRole="button"
              style={[st.row, i < STEPS.length - 1 && st.line]}>
              <View style={[st.check, ok && st.checkOn]}>{ok && <Icon name="check" size={13} color={C.ink} stroke={2.6} />}</View>
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 14, color: ok ? C.dim : C.text, textDecorationLine: ok ? 'line-through' : 'none' }}>{s.title}</T>
                {!ok && <T style={{ fontSize: 12, color: C.faint }}>{s.sub}</T>}
              </View>
              {!ok && <Icon name="chevron" size={16} color={C.faint} />}
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={() => router.push('/aide')} hitSlop={6} accessibilityRole="button" style={{ marginTop: 10 }}>
        <T style={{ fontSize: 13, color: C.gold }}>Comment ça marche ?</T>
      </Pressable>
    </View>
  );
}

/* ---------- Bulles d'aide (une seule fois par écran) ---------- */

export function Tip({ id, title, children }: { id: string; title: string; children: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { AsyncStorage.getItem('tip:' + id).then((v) => setShow(v !== '1')).catch(() => {}); }, [id]);
  if (!show) return null;
  return (
    <View style={[st.card, { borderColor: 'rgba(226,192,141,0.35)', backgroundColor: 'rgba(226,192,141,0.07)', gap: 6 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="sun" size={16} color={C.goldBright} />
        <T style={{ flex: 1, fontSize: 14, fontFamily: F.medium, color: C.goldBright }}>{title}</T>
      </View>
      <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>{children}</T>
      <Pressable onPress={() => { haptic.tap(); setShow(false); AsyncStorage.setItem('tip:' + id, '1').catch(() => {}); }} accessibilityRole="button"
        style={{ alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 }}>
        <T style={{ fontSize: 13, color: C.gold, fontFamily: F.medium }}>Compris</T>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 24, padding: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  line: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.gold, borderColor: C.gold },
});
