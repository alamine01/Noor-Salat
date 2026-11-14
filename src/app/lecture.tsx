import { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';

type ViewToken<T> = { item: T; index?: number | null };
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../components/PageHeader';
import { T, Text } from '../components/Text';
import { Backdrop, Toggle } from '../components/ui';
import { C, F } from '../lib/theme';
import { setReading } from '../lib/store';
import { juzAyahs, localSurahs, surahAyahs } from '../lib/quran';

type Ayah = { key: string; ar: string; fr: string; num: number; surah: string };

/** Lecture d'une sourate ou d'un juz, avec la traduction en option. La position est gardée. */
export default function Lecture() {
  const insetBottom = useSafeAreaInsets().bottom;
  const { kind = 'surah', n = '1', ayah } = useLocalSearchParams<{ kind?: 'surah' | 'juz'; n?: string; ayah?: string }>();
  const [list, setList] = useState<Ayah[]>([]);
  const [title, setTitle] = useState('');
  const [ar, setAr] = useState('');
  const [fr, setFr] = useState(true);
  const [err, setErr] = useState(false);
  const ref = useRef<FlatList<Ayah>>(null);

  useEffect(() => {
    // Coran inclus dans l'appli : lecture hors ligne.
    try {
      const num = Number(n) || 1;
      const ayahs = kind === 'juz' ? juzAyahs(num) : surahAyahs(num);
      setList(ayahs.map((x) => ({ key: String(x.number), ar: x.ar, fr: x.fr, num: x.ayah, surah: x.surahName })));
      const s = localSurahs()[ayahs[0].surah - 1];
      setTitle(kind === 'juz' ? `Juz ${num}` : s.englishName);
      setAr(kind === 'juz' ? '' : s.name);
    } catch { setErr(true); }
  }, [kind, n]);

  useEffect(() => {
    const i = Number(ayah) - 1;
    if (list.length && i > 0) setTimeout(() => ref.current?.scrollToIndex({ index: Math.min(i, list.length - 1), animated: false }), 200);
  }, [list, ayah]);

  const onView = useRef(({ viewableItems }: { viewableItems: ViewToken<unknown>[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) latest.current = first.index;
  }).current;
  const latest = useRef(0);
  useEffect(() => {
    if (!list.length) return;
    const id = setInterval(() => {
      setReading({ kind, n: Number(n), ayah: latest.current + 1, title, ar, total: list.length }).catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, [list, kind, n, title, ar]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop />
      <SafeAreaView edges={['top']} style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <PageHeader title={title || '…'} subtitle={kind === 'juz' ? 'Lecture du juz' : 'Lecture'} right={ar ? <Text style={{ fontFamily: F.arabic, fontSize: 24, lineHeight: 36, color: C.gold }}>{ar}</Text> : undefined} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 6 }}>
          <T style={{ fontSize: 13, color: C.dim }}>Traduction (Hamidullah)</T>
          <Toggle value={fr} onChange={setFr} label="Afficher la traduction" />
        </View>
        {err && <T style={{ color: C.dim, marginTop: 20 }}>Connexion nécessaire pour charger le texte.</T>}
        {!err && !list.length && <T style={{ color: C.dim, marginTop: 20 }}>Chargement…</T>}
        <FlatList ref={ref} data={list} keyExtractor={(a) => a.key} onViewableItemsChanged={onView} viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          onScrollToIndexFailed={(e) => setTimeout(() => ref.current?.scrollToOffset({ offset: e.averageItemLength * e.index, animated: false }), 100)}
          contentContainerStyle={{ paddingBottom: 60 + insetBottom }} showsVerticalScrollIndicator={false}
          renderItem={({ item: a, index }) => (
            <View style={{ paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 10 }}>
              {kind === 'juz' && a.num === 1 && index > 0 && <T style={{ fontSize: 11, letterSpacing: 2, color: C.gold, textAlign: 'center' }}>{a.surah.toUpperCase()}</T>}
              <Text style={{ fontFamily: F.arabic, fontSize: 26, lineHeight: 52, color: C.text, textAlign: 'right', writingDirection: 'rtl' }}>
                {a.ar} <Text style={{ color: C.gold, fontSize: 20 }}>﴿{a.num}﴾</Text>
              </Text>
              {fr && <Text style={{ fontFamily: F.serifItalic, fontSize: 17, lineHeight: 25, color: C.soft }}>{a.num}. {a.fr}</Text>}
            </View>
          )} />
      </SafeAreaView>
    </View>
  );
}
