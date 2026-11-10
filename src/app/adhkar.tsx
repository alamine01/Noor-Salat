import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../components/Screen';
import { PageHeader } from '../components/PageHeader';
import { T, Text, TextInput } from '../components/Text';
import { Icon } from '../components/Icon';
import { Card, Chip, Halo, IconButton, ND, PrimaryButton, Ring, Segmented } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { todayKey } from '../lib/prayer';

type Dhikr = { id: string; ar?: string; tr: string; fr: string; goal: number; custom?: boolean };

// À faire relire : formules du tasbih après la prière.
const AFTER_PRAYER: Dhikr[] = [
  { id: 'subhanallah', ar: 'سُبْحَانَ اللّٰه', tr: 'SubhanAllah', fr: 'Gloire à Allah', goal: 33 },
  { id: 'alhamdulillah', ar: 'الْحَمْدُ لِلّٰه', tr: 'Alhamdulillah', fr: 'Louange à Allah', goal: 33 },
  { id: 'allahuakbar', ar: 'اللّٰهُ أَكْبَر', tr: 'Allahu Akbar', fr: 'Allah est le plus grand', goal: 34 },
];

// À faire relire : formules de dhikr courantes (hadiths), pas des versets.
const FREE: Dhikr[] = [
  ...AFTER_PRAYER.map((d) => ({ ...d, goal: 33 })),
  { id: 'tahlil', ar: 'لَا إِلٰهَ إِلَّا اللّٰه', tr: 'La ilaha illa Allah', fr: 'Nulle divinité sauf Allah', goal: 100 },
  { id: 'istighfar', ar: 'أَسْتَغْفِرُ اللّٰه', tr: 'Astaghfirullah', fr: 'Je demande pardon à Allah', goal: 100 },
  { id: 'bihamdihi', ar: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِه', tr: 'SubhanAllahi wa bihamdihi', fr: 'Gloire et louange à Allah', goal: 100 },
  { id: 'azim', ar: 'سُبْحَانَ اللّٰهِ الْعَظِيم', tr: 'SubhanAllahil ʿAzim', fr: 'Gloire à Allah, le Très-Grand', goal: 33 },
  { id: 'hawqala', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰه', tr: 'La hawla wa la quwwata illa billah', fr: 'Ni force ni puissance sauf par Allah', goal: 33 },
  { id: 'salawat', ar: 'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّد', tr: 'Allahumma salli ʿala Muhammad', fr: 'Ô Allah, prie sur Muhammad ﷺ', goal: 100 },
];

const GOALS = [{ label: '33', n: 33 }, { label: '99', n: 99 }, { label: '100', n: 100 }, { label: '1000', n: 1000 }, { label: 'Sans limite', n: 0 }];
const BEADS = 33;
const SIZE = 340;
const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

export default function Adhkar() {
  const [mode, setMode] = useState(0); // 0 = après la prière, 1 = libre
  // Après la prière
  const [i, setI] = useState(0);
  const [doneSet, setDoneSet] = useState<number[]>([]);
  // Libre
  const [custom, setCustom] = useState<Dhikr[]>([]);
  const [freeId, setFreeId] = useState(FREE[0].id);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [goal, setGoal] = useState(100);
  // Commun
  const [n, setN] = useState(0);
  const [total, setTotal] = useState(0);
  const rip = useRef(new Animated.Value(1)).current;
  const bump = useRef(new Animated.Value(1)).current;
  const key = 'tasbih:' + todayKey();

  useEffect(() => {
    AsyncStorage.getItem(key).then((v) => setTotal(Number(v) || 0)).catch(() => {});
    AsyncStorage.multiGet(['dhikr:custom', 'dhikr:last', 'dhikr:mode']).then(([[, c], [, last], [, m]]) => {
      try { setCustom(JSON.parse(c ?? '[]')); } catch {}
      if (last) setFreeId(last);
      if (m === '1') setMode(1);
    }).catch(() => {});
  }, [key]);

  const all = [...FREE, ...custom];
  const free = all.find((x) => x.id === freeId) ?? FREE[0];
  const d = mode === 0 ? AFTER_PRAYER[i] : free;
  const unlimited = d.goal === 0;
  const done = !unlimited && n >= d.goal;

  function pickMode(m: number) {
    setMode(m); setN(0);
    AsyncStorage.setItem('dhikr:mode', String(m)).catch(() => {});
  }
  function pickFree(id: string) {
    haptic.tap(); setFreeId(id); setN(0);
    AsyncStorage.setItem('dhikr:last', id).catch(() => {});
  }

  function tap() {
    haptic.light();
    rip.setValue(0);
    Animated.timing(rip, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: ND }).start();
    bump.setValue(1.18);
    Animated.timing(bump, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(2)), useNativeDriver: ND }).start();
    const t = total + 1;
    setTotal(t);
    AsyncStorage.setItem(key, String(t)).catch(() => {});

    if (mode === 0) {
      if (n + 1 >= d.goal) {
        haptic.success();
        const nd = i === AFTER_PRAYER.length - 1 ? [] : [...doneSet, i];
        setDoneSet(nd); setN(0); setI((i + 1) % AFTER_PRAYER.length);
      } else setN(n + 1);
      return;
    }
    // Libre : objectif atteint → on vibre, puis un nouveau tour repart à 1.
    const next = done ? 1 : n + 1;
    if (!unlimited && next === d.goal) haptic.success();
    else if (unlimited && next % 33 === 0) haptic.success();
    setN(next);
  }

  async function addCustom() {
    const t = text.trim();
    if (!t) return;
    const item: Dhikr = { id: 'c' + Date.now(), ar: hasArabic(t) ? t : undefined, tr: hasArabic(t) ? '' : t, fr: '', goal, custom: true };
    const list = [...custom, item];
    setCustom(list);
    await AsyncStorage.setItem('dhikr:custom', JSON.stringify(list)).catch(() => {});
    setText(''); setAdding(false); pickFree(item.id); haptic.success();
  }
  function removeCustom(x: Dhikr) {
    Alert.alert('Supprimer ce dhikr ?', x.ar ?? x.tr, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        const list = custom.filter((c) => c.id !== x.id);
        setCustom(list);
        await AsyncStorage.setItem('dhikr:custom', JSON.stringify(list)).catch(() => {});
        if (freeId === x.id) pickFree(FREE[0].id);
      } },
    ]);
  }

  const shown = unlimited ? n % BEADS : n;
  const span = unlimited ? BEADS : d.goal;
  const lit = done ? BEADS : Math.round((shown / span) * BEADS);

  return (
    <Screen>
      <PageHeader back={false} title="Dhikr" subtitle={mode === 0 ? 'Après la prière' : 'Dhikr libre'}
        right={<IconButton icon="refresh" label="Recommencer" onPress={() => { setI(0); setN(0); setDoneSet([]); }} />} />

      <Segmented items={['Après la prière', 'Dhikr libre']} value={mode} onChange={pickMode} />

      <Pressable onPress={tap} accessibilityRole="button" accessibilityLabel={`${d.tr || d.ar}, ${n}${unlimited ? '' : ` sur ${d.goal}`}. Touche pour compter.`}
        style={{ alignSelf: 'center', width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Halo size={240} opacity={0.28} />
        {Array.from({ length: BEADS }).map((_, b) => {
          const a = (b / BEADS) * Math.PI * 2 - Math.PI / 2;
          const on = b < lit;
          return <View key={b} style={[st.bead, { left: SIZE / 2 + 152 * Math.cos(a) - 4, top: SIZE / 2 + 152 * Math.sin(a) - 4, backgroundColor: on ? C.goldBright : 'rgba(255,255,255,0.12)' }, on && st.beadOn]} />;
        })}
        <Ring size={268} stroke={2.5} value={done ? 1 : shown / span} duration={400} gradient={false}>
          <Animated.View style={[st.ripple, { opacity: rip.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }), transform: [{ scale: rip.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.35] }) }] }]} />
          <View style={st.core}>
            {d.ar
              ? <Text numberOfLines={2} adjustsFontSizeToFit style={{ fontFamily: F.arabic, fontSize: 28, lineHeight: 44, color: C.goldBright, textAlign: 'center', paddingHorizontal: 18 }}>{d.ar}</Text>
              : <Text numberOfLines={2} adjustsFontSizeToFit style={{ fontFamily: F.serifItalic, fontSize: 22, lineHeight: 28, color: C.goldBright, textAlign: 'center', paddingHorizontal: 18 }}>{d.tr}</Text>}
            <Animated.Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.thin, fontSize: 64, lineHeight: 70, color: C.text, fontVariant: ['tabular-nums'], transform: [{ scale: bump }] }}>{n}</Animated.Text>
            <T style={{ fontSize: 12, color: done ? C.goldBright : C.dim }}>{done ? 'terminé · touche pour recommencer' : unlimited ? 'sans limite' : `sur ${d.goal}`}</T>
          </View>
        </Ring>
      </Pressable>

      {(d.ar && d.tr) || d.fr ? (
        <View style={{ alignItems: 'center', marginTop: -4 }}>
          {d.ar && !!d.tr && <Text style={{ fontFamily: F.serifItalic, fontSize: 22, color: C.text, textAlign: 'center' }}>{d.tr}</Text>}
          {!!d.fr && <T style={{ fontSize: 13, color: C.dim, marginTop: 2 }}>{d.fr}</T>}
        </View>
      ) : null}

      {mode === 0 ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {AFTER_PRAYER.map((x, k) => {
            const on = k === i;
            const fin = doneSet.includes(k);
            return (
              <Pressable key={k} onPress={() => { haptic.tap(); setI(k); setN(0); }} accessibilityRole="tab" accessibilityState={{ selected: on }}
                style={[st.pill, { backgroundColor: on ? 'rgba(226,192,141,0.16)' : C.surface2 }]}>
                <Text style={{ fontFamily: F.arabic, fontSize: 17, lineHeight: 26, color: on ? C.goldBright : C.soft }}>{x.ar}</Text>
                <T style={{ fontSize: 10, color: on ? C.goldBright : C.dim }}>{on ? `${n} / ${x.goal}` : fin ? 'terminé' : `${x.goal} fois`}</T>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <>
          <Card style={{ paddingVertical: 4 }}>
            {all.map((x, k) => {
              const on = x.id === freeId;
              return (
                <Pressable key={x.id} onPress={() => pickFree(x.id)} onLongPress={x.custom ? () => removeCustom(x) : undefined}
                  accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityHint={x.custom ? 'Appui long pour supprimer' : undefined}
                  style={[st.item, k < all.length - 1 && st.line]}>
                  <View style={{ flex: 1, gap: 1 }}>
                    {x.ar ? <Text style={{ fontFamily: F.arabic, fontSize: 18, lineHeight: 30, color: on ? C.goldBright : C.text }}>{x.ar}</Text> : null}
                    <T style={{ fontSize: 12.5, color: x.ar ? C.dim : on ? C.goldBright : C.text }}>{[x.tr, x.fr].filter(Boolean).join(' · ') || ' '}</T>
                  </View>
                  <T style={{ fontSize: 12, color: C.dim }}>{x.goal ? `${x.goal}×` : '∞'}</T>
                  {on ? <Icon name="check" size={16} color={C.goldBright} /> : <View style={{ width: 16 }} />}
                </Pressable>
              );
            })}
          </Card>

          {adding ? (
            <Card style={{ paddingVertical: 16, gap: 12 }}>
              <T style={{ fontSize: 14 }}>Mon dhikr</T>
              <TextInput value={text} onChangeText={(v) => setText(v.slice(0, 120))} placeholder="En arabe ou en français" placeholderTextColor="#6B7183"
                autoFocus multiline style={st.input} accessibilityLabel="Texte du dhikr" />
              <T style={{ fontSize: 12, color: C.dim }}>Nombre de fois</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {GOALS.map((g) => <Chip key={g.label} label={g.label} on={goal === g.n} onPress={() => setGoal(g.n)} />)}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Pressable onPress={() => { setAdding(false); setText(''); }} hitSlop={8} accessibilityRole="button"><T style={{ fontSize: 14, color: C.dim }}>Annuler</T></Pressable>
                <PrimaryButton title="Ajouter" onPress={addCustom} disabled={!text.trim()} style={{ flex: 1 }} />
              </View>
            </Card>
          ) : (
            <Pressable onPress={() => { haptic.tap(); setAdding(true); }} accessibilityRole="button" style={st.add}>
              <Icon name="plus" size={16} color={C.goldBright} />
              <T style={{ fontSize: 14, color: C.goldBright }}>Ajouter mon dhikr</T>
            </Pressable>
          )}
          {custom.length > 0 && <T style={{ textAlign: 'center', fontSize: 11, color: C.faint, marginTop: -8 }}>Appui long sur un dhikr ajouté pour le supprimer</T>}
        </>
      )}

      <T style={{ textAlign: 'center', fontSize: 12, color: C.dim }}>Total aujourd'hui · <T style={{ fontSize: 12, fontVariant: ['tabular-nums'] }}>{total}</T></T>
    </Screen>
  );
}

const st = StyleSheet.create({
  bead: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  beadOn: { shadowColor: C.goldBright, shadowOpacity: 0.9, shadowRadius: 6, elevation: 3 },
  ripple: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1.5, borderColor: 'rgba(243,217,164,0.6)' },
  core: { position: 'absolute', width: 216, height: 216, borderRadius: 108, backgroundColor: '#11161F', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: { flex: 1, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  item: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  line: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, color: C.text, fontFamily: F.regular, fontSize: 17, paddingHorizontal: 14, paddingVertical: 12, textAlignVertical: 'top' },
  add: { height: 50, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(226,192,141,0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
