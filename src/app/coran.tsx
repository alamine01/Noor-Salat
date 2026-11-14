import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../components/PageHeader';
import { Label, T, Text, TextInput } from '../components/Text';
import { Icon } from '../components/Icon';
import { Backdrop, Rise, Segmented, useLoop } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { JUZ, Surah, loadSurahs, norm } from '../lib/quran';
import { ReadingPos, getReading } from '../lib/store';

// Le texte est inclus dans l'appli (src/data/quran.json, généré depuis quran-json / tanzil.net) : hors ligne, jamais recopié à la main.
export default function Coran() {
  const insetBottom = useSafeAreaInsets().bottom;
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState(0);
  const [last, setLast] = useState<ReadingPos | null>(null);

  useEffect(() => { loadSurahs().then(setSurahs).catch(() => setErr(true)); }, []);
  useFocusEffect(useCallback(() => { getReading().then(setLast); }, []));

  const nq = norm(q);
  const list = surahs.filter((s) => !nq || String(s.number) === nq || norm(s.englishName).includes(nq));
  const open = (kind: 'surah' | 'juz', n: number) => { haptic.tap(); router.push({ pathname: '/lecture', params: { kind, n: String(n) } }); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop />
      <SafeAreaView edges={['top']} style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12, gap: 16 }}>
        <PageHeader title="Le Coran" subtitle="114 sourates · texte Uthmani" right={<Text style={{ fontFamily: F.arabic, fontSize: 26, lineHeight: 40, color: C.gold }}>القرآن</Text>} />

        {last && <ResumeCard last={last} onPress={() => router.push({ pathname: '/lecture', params: { kind: last.kind, n: String(last.n), ayah: String(last.ayah) } })} />}

        <View style={{ gap: 10 }}>
          <View style={st.search}>
            <Icon name="search" size={18} color={C.faint} stroke={1.8} />
            <TextInput value={q} onChangeText={(v) => { setQ(v); setTab(0); }} placeholder="Chercher : Yasin, Mulk, 18…" placeholderTextColor={C.faint}
              accessibilityLabel="Chercher une sourate" style={{ flex: 1, color: C.text, fontFamily: F.regular, fontSize: 14, height: 46 }} />
          </View>
          <Segmented items={['Sourates', 'Juz']} value={tab} onChange={setTab} />
        </View>

        {err && surahs.length === 0 && <T style={{ color: C.dim }}>Impossible d’afficher les sourates.</T>}
        {tab === 0 ? (
          <FlatList data={list} keyExtractor={(s) => String(s.number)} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insetBottom }}
            ListEmptyComponent={surahs.length ? <T style={{ textAlign: 'center', color: C.dim, marginTop: 30 }}>Aucune sourate trouvée</T> : undefined}
            renderItem={({ item: s }) => (
              <Pressable onPress={() => open('surah', s.number)} style={({ pressed }) => [st.row, { opacity: pressed ? 0.7 : 1 }]} accessibilityRole="button">
                <Badge n={s.number} />
                <View style={{ flex: 1, gap: 3 }}>
                  <T style={{ fontSize: 15, fontFamily: F.medium }}>{s.englishName}</T>
                  <T style={{ fontSize: 12, color: C.dim }}>{s.numberOfAyahs} versets · {s.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}</T>
                </View>
                <Text style={{ fontFamily: F.arabic, fontSize: 20, lineHeight: 32, color: C.gold }}>{s.name.replace('سُورَةُ ', '')}</Text>
              </Pressable>
            )} />
        ) : (
          <FlatList data={JUZ.map((j, i) => ({ n: i + 1, s: j[0], a: j[1] }))} keyExtractor={(j) => String(j.n)} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insetBottom }}
            renderItem={({ item: j }) => {
              const sName = surahs.find((s) => s.number === j.s)?.englishName ?? `Sourate ${j.s}`;
              return (
                <Pressable onPress={() => open('juz', j.n)} style={({ pressed }) => [st.row, { opacity: pressed ? 0.7 : 1 }]} accessibilityRole="button">
                  <Badge n={j.n} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <T style={{ fontSize: 15, fontFamily: F.medium }}>Juz {j.n}</T>
                    <T style={{ fontSize: 12, color: C.dim }}>Commence à {sName} {j.s}:{j.a}</T>
                  </View>
                  <Icon name="chevron" size={16} color={C.faint} />
                </Pressable>
              );
            }} />
        )}
      </SafeAreaView>
    </View>
  );
}

function ResumeCard({ last, onPress }: { last: ReadingPos; onPress: () => void }) {
  const sh = useLoop(5000);
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: 1400, delay: 400, easing: Easing.bezier(0.3, 0.7, 0.2, 1), useNativeDriver: false }).start();
  }, [grow]);
  const pct = last.total ? Math.min(1, last.ayah / last.total) : 0;
  return (
    <Rise delay={100}>
      <Pressable onPress={onPress} accessibilityRole="button" style={st.resume}>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: 160, opacity: 0.5, transform: [{ translateX: sh.interpolate({ inputRange: [0, 1], outputRange: [-200, 420] }) }] }}>
          <LinearGradient colors={['rgba(243,217,164,0)', 'rgba(243,217,164,0.18)', 'rgba(243,217,164,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
        <Label style={{ fontSize: 10 }}>Reprendre la lecture</Label>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: F.serif, fontSize: 24, color: C.text }}>{last.title} <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.dim }}>· verset {last.ayah}</Text></Text>
          {last.ar ? <Text style={{ fontFamily: F.arabic, fontSize: 20, lineHeight: 30, color: C.goldBright }}>{last.ar}</Text> : null}
        </View>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <Animated.View style={{ height: 3, backgroundColor: C.gold, width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.round(pct * 100)}%`] }) }} />
        </View>
      </Pressable>
    </Rise>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[st.diamond, { transform: [{ rotate: '45deg' }], borderColor: 'rgba(226,192,141,0.55)' }]} />
      <View style={[st.diamond, { borderColor: 'rgba(226,192,141,0.3)' }]} />
      <T style={{ fontSize: 12, fontFamily: F.medium, fontVariant: ['tabular-nums'] }}>{n}</T>
    </View>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  row: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  diamond: { position: 'absolute', width: 26, height: 26, borderWidth: 1.2, borderRadius: 6 },
  resume: { borderRadius: 24, padding: 16, gap: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(226,192,141,0.3)', backgroundColor: 'rgba(226,192,141,0.08)' },
});
