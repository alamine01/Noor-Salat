import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '../components/PageHeader';
import { Label, T } from '../components/Text';
import { GhostButton, PrimaryButton } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { CANCEL_DELAY_H, requestCancel } from '../lib/engagement';
import { AYAH_TOTAL, pageFrom } from '../lib/quran';

type Ayah = { ar: string; fr: string; ref: string };
const MIN_SEC = 60;         // temps de lecture minimum

/** Annuler un engagement Taqwa : d'abord lire une page entière du Coran (arabe + Hamidullah). */
export default function TaqwaPage() {
  const [page, setPage] = useState<number | null>(null);
  const [next, setNext] = useState(1);
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [err, setErr] = useState(false);
  const [wait, setWait] = useState(MIN_SEC);
  const [bottom, setBottom] = useState(false);
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      // Une page différente à chaque fois : on reprend là où la dernière lecture s'est arrêtée.
      // Coran inclus dans l'appli : fonctionne hors ligne.
      const saved = Number(await AsyncStorage.getItem('taqwa:pos'));
      const n = saved >= 1 && saved <= AYAH_TOTAL ? saved : 1 + Math.floor(Math.random() * AYAH_TOTAL);
      try {
        const list = pageFrom(n);
        setPage(n);
        setNext(n + list.length);
        setAyahs(list.map((a) => ({ ar: a.ar, fr: a.fr, ref: a.ref })));
      } catch { setErr(true); }
    })();
  }, []);

  useEffect(() => {
    if (!ayahs) return;
    Animated.timing(bar, { toValue: 1, duration: MIN_SEC * 1000, easing: Easing.linear, useNativeDriver: false }).start();
    const id = setInterval(() => setWait((w) => (w > 0 ? w - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [ayahs, bar]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) setBottom(true);
  }

  async function finish() {
    haptic.success();
    if (page) await AsyncStorage.setItem('taqwa:pos', String(((next - 1) % AYAH_TOTAL) + 1));
    await requestCancel();
    router.back();
  }

  const ready = !!ayahs && wait === 0 && bottom;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <PageHeader title="Une page du Coran" subtitle={ayahs?.length ? `${ayahs[0].ref} → ${ayahs[ayahs.length - 1].ref}` : 'Avant d’annuler'} />
      </View>
      {err ? (
        <View style={{ padding: 24, gap: 14 }}>
          <T style={{ color: C.soft, textAlign: 'center' }}>Impossible d’afficher la page.</T>
          <GhostButton title="Retour" onPress={() => router.back()} />
        </View>
      ) : !ayahs ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
      ) : (
        <>
          <ScrollView onScroll={onScroll} scrollEventThrottle={200} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, gap: 18 }}>
            <T style={{ fontSize: 13, lineHeight: 20, color: C.dim }}>Prends le temps de lire. Si tu annules toujours après, le filtre se coupera dans {CANCEL_DELAY_H} heures.</T>
            {ayahs.map((a, k) => (
              <View key={k} style={st.ayah}>
                <Text style={st.ar}>{a.ar}</Text>
                <T style={{ fontSize: 14, lineHeight: 22, color: C.soft }}>{a.fr}</T>
                <Label style={{ fontSize: 9.5 }}>{a.ref}</Label>
              </View>
            ))}
          </ScrollView>
          <View style={st.foot}>
            <View style={st.track}><Animated.View style={{ height: '100%', backgroundColor: C.gold, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /></View>
            <PrimaryButton title={ready ? `J'ai lu · couper dans ${CANCEL_DELAY_H} h` : wait > 0 ? `Lis encore ${wait} s` : 'Lis la page jusqu’en bas'} disabled={!ready} onPress={finish} />
            <GhostButton title="Finalement, je reste engagé" color={C.goldBright} onPress={() => router.back()} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  ayah: { gap: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  ar: { fontFamily: F.arabic, fontSize: 24, lineHeight: 46, color: C.goldBright, textAlign: 'right', writingDirection: 'rtl' },
  foot: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 10, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg },
  track: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
});
