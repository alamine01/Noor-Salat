import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../components/Screen';
import { PageHeader } from '../components/PageHeader';
import { T } from '../components/Text';
import { Icon } from '../components/Icon';
import { ND, Ring, Rise } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { todayKey } from '../lib/prayer';

// Liste à faire relire avant publication.
const SUNNA: [string, string][] = [
  ['Dire « Bismillah » avant de manger', 'Repas'],
  ['Manger et boire de la main droite', 'Repas'],
  ['Utiliser le siwak', 'Purification'],
  ['Entrer à la mosquée du pied droit', 'Mosquée'],
  ['Saluer avec « Assalamu alaykum »', 'Les autres'],
  ["Sourire à ton frère, c'est une aumône", 'Les autres'],
  ['Dormir sur le côté droit', 'La nuit'],
  ['Jeûner le lundi et le jeudi', 'La semaine'],
];

export default function Sunna() {
  const [done, setDone] = useState<number[]>([]);
  const key = 'sunna:' + todayKey();
  useEffect(() => { AsyncStorage.getItem(key).then((v) => v && setDone(JSON.parse(v))).catch(() => {}); }, [key]);
  function toggle(i: number) {
    const n = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    if (n.length === SUNNA.length) haptic.success(); else haptic.light();
    setDone(n);
    AsyncStorage.setItem(key, JSON.stringify(n)).catch(() => {});
  }
  const all = done.length === SUNNA.length;
  return (
    <Screen nav={false} gap={8}>
      <PageHeader title="Sunna" subtitle="Petits gestes du jour"
        right={<Ring size={56} stroke={3} value={done.length / SUNNA.length} duration={500} gradient={false}><T style={{ position: 'absolute', fontSize: 13, fontFamily: F.medium }}>{done.length}/{SUNNA.length}</T></Ring>} />
      <View style={{ height: 10 }} />
      {SUNNA.map(([label, tag], i) => <Item key={i} label={label} tag={tag} on={done.includes(i)} delay={100 + i * 50} onPress={() => toggle(i)} />)}
      <T style={{ textAlign: 'center', fontSize: 12, color: all ? C.goldBright : C.faint, marginTop: 14 }}>
        {all ? 'Machallah, toutes les sunna du jour sont faites.' : 'La liste repart à zéro chaque jour.'}
      </T>
    </Screen>
  );
}

function Item({ label, tag, on, delay, onPress }: { label: string; tag: string; on: boolean; delay: number; onPress: () => void }) {
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!on) return;
    pop.setValue(0.6);
    Animated.timing(pop, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(3)), useNativeDriver: ND }).start();
  }, [on, pop]);
  return (
    <Rise delay={delay}>
      <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
        style={[st.item, on && { backgroundColor: 'rgba(226,192,141,0.08)', borderColor: 'rgba(226,192,141,0.3)' }]}>
        <Animated.View style={[st.box, on ? st.boxOn : null, { transform: [{ scale: pop }] }]}>
          {on && <Icon name="check" size={14} color={C.ink} stroke={2.8} />}
        </Animated.View>
        <View style={{ flex: 1, gap: 3 }}>
          <T style={{ fontSize: 14, lineHeight: 19, color: on ? C.goldBright : C.text }}>{label}</T>
          <T style={{ fontSize: 11, color: C.faint }}>{tag}</T>
        </View>
      </Pressable>
    </Rise>
  );
}

const st = StyleSheet.create({
  item: { minHeight: 66, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  box: { width: 26, height: 26, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: C.gold, borderColor: C.gold, shadowColor: C.goldBright, shadowOpacity: 0.6, shadowRadius: 10 },
});
