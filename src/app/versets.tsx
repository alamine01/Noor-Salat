import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../components/Screen';
import { PageHeader } from '../components/PageHeader';
import { Ar, Label, T, Text } from '../components/Text';
import { Card, GhostButton, PrimaryButton, Rise } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { PrayerKey } from '../lib/prayer';
import { FOCUS_LEVELS, FocusLevel, getFocusLevel, getFocusSession, levelText, logPrayer } from '../lib/store';
import { cancelTodayBlock, pauseFocus, stopFocus, unlock } from '../lib/blocker';
import { playWoosh } from '../lib/sounds';
import { ayahsFrom } from '../lib/quran';

type Ayah = { ar: string; fr: string; ref: string };
const COUNT = 5;
const MIN_SEC = 8; // temps de lecture minimum par verset
const TOTAL = 6236;

/**
 * Lire des versets à la suite, tous sur la même page :
 *  - valider une prière sans tapis (5 versets) ;
 *  - mode Focus « pause » ou « stop » : nombre de versets, temps de lecture et attente finale
 *    selon la difficulté FIGÉE au début de la session (réglée seulement dans Réglages).
 * La lecture reprend là où la précédente s'est arrêtée.
 */
export default function Versets() {
  const { prayer, pause, stop } = useLocalSearchParams<{ prayer?: PrayerKey; pause?: string; stop?: string }>();
  const pauseMin = Number(pause) || 0;
  const focusMode: 'pause' | 'stop' | null = pauseMin ? 'pause' : stop ? 'stop' : null;
  const [lv, setLv] = useState<FocusLevel | null>(null);
  const [ready, setReady] = useState(!focusMode);
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null);
  const [err, setErr] = useState(false);
  const [left, setLeft] = useState(0);                          // secondes de lecture restantes
  const [patience, setPatience] = useState<number | null>(null); // attente finale
  const [finished, setFinished] = useState(false);
  const bar = useRef(new Animated.Value(0)).current;

  // Niveau de la session en cours (figé), sinon celui des Réglages.
  useEffect(() => {
    if (!focusMode) return;
    (async () => {
      const s = await getFocusSession();
      setLv(s?.level ? FOCUS_LEVELS[s.level] : await getFocusLevel());
      setReady(true);
    })();
  }, [focusMode]);

  const count = lv?.verses ?? COUNT;
  const readSec = count * (lv?.perVerse ?? MIN_SEC);

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { router.back(); return true; });
    return () => sub.remove();
  }, []));

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const start = Number(await AsyncStorage.getItem('versets:pos')) || 1;
      try {
        // Coran inclus dans l'appli : plus besoin d'internet.
        setAyahs(ayahsFrom(start, count).map((a) => ({ ar: a.ar, fr: a.fr, ref: a.ref })));
        await AsyncStorage.setItem('versets:pos', String(((start - 1 + count) % TOTAL) + 1));
      } catch {
        setErr(true);
      }
    })();
  }, [ready, count]);

  // Temps de lecture minimum pour l'ensemble des versets
  useEffect(() => {
    if (!ayahs) return;
    setLeft(readSec);
    bar.setValue(0);
    Animated.timing(bar, { toValue: 1, duration: readSec * 1000, easing: Easing.linear, useNativeDriver: false }).start();
    const id = setInterval(() => setLeft((w) => (w > 0 ? w - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [ayahs, readSec, bar]);

  // Attente finale (niveaux Moyen et Difficile)
  useEffect(() => {
    if (patience === null || patience <= 0) return;
    const id = setTimeout(() => setPatience((p) => (p ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [patience]);

  async function finishFocus() {
    haptic.success();
    if (focusMode === 'pause') await pauseFocus(pauseMin);
    if (focusMode === 'stop') await stopFocus();
    router.back();
  }

  async function done() {
    if (focusMode) {
      if (lv && lv.wait > 0) { haptic.light(); setPatience(lv.wait); return; }
      return finishFocus();
    }
    haptic.success();
    setFinished(true);
    await logPrayer({ prayer: prayer ?? 'Dhuhr', at: new Date().toISOString(), method: 'versets' });
    cancelTodayBlock(prayer ?? 'Dhuhr');
    unlock(prayer ?? undefined);
    setTimeout(playWoosh, 300);
  }

  const finalLabel = focusMode === 'pause' ? `Commencer ma pause de ${pauseMin} min` : focusMode === 'stop' ? 'Arrêter la session' : 'Terminer et valider';
  const title = focusMode === 'pause' ? 'Avant ta pause' : focusMode === 'stop' ? 'Avant d’arrêter' : `Lire ${COUNT} versets`;
  const subtitle = focusMode && lv ? `${levelText(lv)} · niveau ${lv.label.toLowerCase()}` : 'Valider sans tapis';
  const mmss = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}` : `${s} s`);

  return (
    <Screen nav={false}>
      <PageHeader title={title} subtitle={subtitle} />
      {err && (
        <Card style={{ padding: 18, gap: 12 }}>
          <T style={{ color: C.soft, lineHeight: 21 }}>Impossible d’afficher les versets.{focusMode ? '' : ' Tu peux scanner ton tapis à la place.'}</T>
          {focusMode
            ? <GhostButton title="Retour" onPress={() => router.back()} />
            : <GhostButton title="Scanner mon tapis" icon="qr" onPress={() => router.replace({ pathname: '/scan', params: { prayer: prayer ?? '', from: 'block' } })} />}
        </Card>
      )}
      {!err && !ayahs && !finished && <T style={{ color: C.dim, textAlign: 'center', marginTop: 40 }}>Chargement des versets…</T>}

      {ayahs && !finished && patience === null && (
        <>
          <T style={{ fontSize: 13, lineHeight: 20, color: C.dim }}>Prends le temps de lire chaque verset jusqu’en bas de la page.</T>
          {ayahs.map((a, k) => (
            <Rise key={k} delay={Math.min(k, 6) * 60}>
              <Card style={{ padding: 20, gap: 12 }}>
                <Label style={{ textAlign: 'center' }}>{a.ref}</Label>
                <Ar style={{ fontSize: 25, lineHeight: 48, color: C.goldBright }}>{a.ar}</Ar>
                <Text style={{ fontFamily: F.serifItalic, fontSize: 17, lineHeight: 25, color: C.soft, textAlign: 'center' }}>{a.fr}</Text>
              </Card>
            </Rise>
          ))}
          <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <Animated.View style={{ height: 3, backgroundColor: C.gold, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
          </View>
          <PrimaryButton disabled={left > 0} title={left > 0 ? `Prends le temps de lire · ${mmss(left)}` : focusMode && lv?.wait ? 'J’ai lu' : finalLabel} onPress={done} />
          {focusMode && <GhostButton title="Finalement, je continue" color={C.goldBright} onPress={() => router.back()} />}
          <T style={{ fontSize: 11, color: C.faint, textAlign: 'center' }}>Traduction : Muhammad Hamidullah</T>
        </>
      )}

      {patience !== null && (
        <Rise style={{ alignItems: 'center', gap: 14, marginTop: 30 }}>
          <T style={{ fontSize: 13, color: C.gold }}>{patience > 0 ? 'Encore un instant' : 'Tu peux continuer'}</T>
          <Text style={{ fontFamily: F.thin, fontSize: 64, color: C.text, fontVariant: ['tabular-nums'] }}>{patience}</Text>
          <T style={{ color: C.dim, textAlign: 'center', lineHeight: 21 }}>Prends ce temps pour te demander si tu en as vraiment besoin.</T>
          <PrimaryButton title={patience > 0 ? `Patiente encore ${patience} s` : finalLabel} disabled={patience > 0} onPress={finishFocus} style={{ alignSelf: 'stretch', marginTop: 10 }} />
          <GhostButton title="Finalement, je continue" color={C.goldBright} onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </Rise>
      )}

      {finished && (
        <Rise style={{ alignItems: 'center', gap: 14, marginTop: 40 }}>
          <Ar style={{ fontSize: 30 }}>تقبّل الله</Ar>
          <Text style={{ fontFamily: F.serif, fontSize: 40, color: C.text }}>Qu'Allah l'accepte</Text>
          <T style={{ color: C.dim, textAlign: 'center' }}>Ta prière est validée, et tes applis sont libres. Pense à scanner ton tapis la prochaine fois.</T>
          <PrimaryButton title="Retour à l'accueil" style={{ alignSelf: 'stretch', marginTop: 16 }} onPress={() => router.replace('/')} />
        </Rise>
      )}
    </Screen>
  );
}
