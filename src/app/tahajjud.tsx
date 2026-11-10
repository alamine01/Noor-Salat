import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { scheduleSafe } from '../lib/fajr-helpers';
import { alarmKitAuthorized, alarmKitAvailable, requestAlarmKit } from '../lib/ios';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '../components/PageHeader';
import { Label, T } from '../components/Text';
import { Icon } from '../components/Icon';
import { Backdrop, ND, PrimaryButton, Rise, useBreath, useLoop } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { hhmm, loadTodayTimes, nightThirds } from '../lib/prayer';
import { getTahajjud, setTahajjud } from '../lib/store';

type Night = ReturnType<typeof nightThirds>;

/** Dernier tiers de la nuit : entre le Maghrib et le Fajr. Rappel doux, sans blocage. */
export default function Tahajjud() {
  const [night, setNight] = useState<Night | null>(null);
  const [wake, setWake] = useState<Date | null>(null);
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const d = await loadTodayTimes();
      const n = nightThirds(d.times);
      setNight(n);
      const s = await getTahajjud();
      const w = new Date(n.t2);
      if (s.minutes != null) {
        w.setHours(Math.floor(s.minutes / 60), s.minutes % 60, 0, 0);
        if (w < n.maghrib) w.setDate(w.getDate() + 1);
      } else w.setMinutes(Math.ceil(w.getMinutes() / 15) * 15, 0, 0);
      setWake(w);
      setOn(s.on);
    })();
  }, []);

  function step(d: number) {
    if (!wake || !night) return;
    haptic.tap();
    const w = new Date(wake.getTime() + d * 60_000);
    if (w <= night.maghrib || w >= night.fajr) return;
    setWake(w);
    if (on) toggle(true, w);
  }

  /** Essai : la même notification, 10 secondes plus tard (on peut quitter l'appli pour la voir arriver). */
  async function testReminder() {
    haptic.light();
    if (Platform.OS === 'web') return setMsg("Les rappels marchent dans l'appli mobile.");
    const perm = await Notifications.requestPermissionsAsync().catch(() => null);
    if (!perm?.granted) return setMsg('Autorise les notifications pour Noor Salat dans les réglages du téléphone.');
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Tahajjud · التهجد', body: 'Le dernier tiers de la nuit est là. Lève-toi pour prier.', sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId: 'prieres' },
    }).then(() => setMsg('Rappel d\u2019essai dans 10 secondes : tu peux quitter l\u2019appli.'))
      .catch(() => setMsg("La notification n'a pas pu être programmée."));
  }

  async function toggle(v: boolean, w = wake) {
    if (!w) return;
    setOn(v);
    await setTahajjud({ minutes: w.getHours() * 60 + w.getMinutes(), on: v });
    if (Platform.OS === 'web') return setMsg(v ? "Les rappels marchent dans l'appli mobile." : '');
    // Le rappel revient chaque nuit : il est programmé avec les prières, une semaine à l'avance.
    if (v) {
      const perm = await Notifications.requestPermissionsAsync().catch(() => null);
      if (!perm?.granted) return setMsg('Autorise les notifications pour Noor Salat dans les réglages du téléphone.');
      // iPhone (iOS 26+) : vrai réveil, qui sonne même en silencieux.
      if (alarmKitAvailable() && !(await alarmKitAuthorized())) await requestAlarmKit();
    }
    await scheduleSafe();
    setMsg(v ? `Rappel programmé chaque nuit à ${hhmm(w)}.` : '');
  }

  const inThird = !!(wake && night && wake >= night.t2);
  const moon = useBreath(7000);
  const travel = useLoop(9000);
  const [barW, setBarW] = useState(0);
  const [segW, setSegW] = useState(0);
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fill, { toValue: 1, duration: 1200, delay: 600, easing: Easing.bezier(0.3, 0.7, 0.2, 1), useNativeDriver: false }).start(); }, [fill]);

  return (
    <View style={{ flex: 1, backgroundColor: '#04050A' }}>
      <LinearGradient colors={['#04050A', '#0A0E22', '#121733']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <Backdrop stars top="rgba(0,0,0,0)" bottom="rgba(0,0,0,0)" />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
        <PageHeader title="Tahajjud" subtitle="La prière de la nuit" />

        <Animated.View style={{ alignSelf: 'center', marginTop: 24, width: 120, height: 120, transform: [{ translateY: moon.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }}>
          <View style={{ position: 'absolute', left: -40, top: -40, width: 200, height: 200 }}>
            <Svg width={200} height={200}>
              <Defs><RadialGradient id="mg" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={C.goldBright} stopOpacity={0.28} /><Stop offset="1" stopColor={C.goldBright} stopOpacity={0} /></RadialGradient></Defs>
              <Rect width={200} height={200} fill="url(#mg)" />
            </Svg>
          </View>
          <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden', transform: [{ rotate: '-20deg' }] }}>
            <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: C.goldBright }} />
            <View style={{ position: 'absolute', left: 26, top: -8, width: 120, height: 120, borderRadius: 60, backgroundColor: '#070A18' }} />
          </View>
        </Animated.View>

        <Rise delay={200} style={{ alignItems: 'center', marginTop: 26 }}>
          <Label>Le dernier tiers commence à</Label>
          <Text style={{ fontFamily: F.thin, fontSize: 76, lineHeight: 84, color: C.text, fontVariant: ['tabular-nums'], marginTop: 6 }}>{night ? hhmm(night.t2) : '--:--'}</Text>
          <T style={{ fontSize: 13, color: C.dim }}>{night ? `jusqu'au Fajr à ${hhmm(night.fajr)}` : ' '}</T>
        </Rise>

        <Rise delay={350} style={{ marginTop: 26 }}>
          <View style={{ height: 8, flexDirection: 'row', gap: 4 }} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
            <View style={st.seg} /><View style={st.seg} />
            <View style={[st.seg, { overflow: 'hidden' }]} onLayout={(e) => setSegW(e.nativeEvent.layout.width)}>
              <Animated.View style={{ height: 8, borderRadius: 4, backgroundColor: C.gold, width: fill.interpolate({ inputRange: [0, 1], outputRange: [0, segW] }) }} />
            </View>
            <Animated.View style={[st.dot, { left: 0, transform: [{ translateX: travel.interpolate({ inputRange: [0, 1], outputRange: [0, barW] }) }] }]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            {night && [['Maghrib ' + hhmm(night.maghrib), C.dim], [hhmm(night.t1), C.dim], [hhmm(night.t2), C.gold], ['Fajr ' + hhmm(night.fajr), C.dim]].map(([l, c]) => (
              <T key={l} style={{ fontSize: 11, color: c, fontVariant: ['tabular-nums'] }}>{l}</T>
            ))}
          </View>
        </Rise>

        <Rise delay={500} style={st.card}>
          <T style={{ fontSize: 12, color: C.dim }}>Me réveiller à</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Pressable style={st.step} onPress={() => step(-15)} accessibilityLabel="15 minutes plus tôt" accessibilityRole="button"><Icon name="minus" size={20} color={C.text} /></Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: F.light, fontSize: 36, color: C.text, fontVariant: ['tabular-nums'] }}>{wake ? hhmm(wake) : '--:--'}</Text>
              <T style={{ fontSize: 11, color: inThird ? C.gold : C.dim }}>{inThird ? 'dans le dernier tiers' : 'avant le dernier tiers'}</T>
            </View>
            <Pressable style={st.step} onPress={() => step(15)} accessibilityLabel="15 minutes plus tard" accessibilityRole="button"><Icon name="plus" size={20} color={C.text} /></Pressable>
          </View>
        </Rise>

        <View style={{ flex: 1 }} />
        <Rise delay={600} style={{ gap: 10, paddingBottom: 16 }}>
          {on ? (
            <Pressable onPress={() => toggle(false)} accessibilityRole="button" style={[st.onBtn]}>
              <Icon name="bell" size={18} color={C.goldBright} stroke={1.9} />
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.goldBright }}>Rappel activé · {wake ? hhmm(wake) : ''}</Text>
            </Pressable>
          ) : <PrimaryButton icon="bell" title="Activer le rappel" onPress={() => toggle(true)} />}
          <T style={{ textAlign: 'center', fontSize: 12, color: C.faint }}>{msg || 'Un rappel doux chaque nuit, sans blocage des applis.'}</T>
          <Pressable onPress={testReminder} accessibilityRole="button" style={{ alignSelf: 'center', padding: 8 }}>
            <T style={{ fontSize: 13, color: C.gold }}>Tester le rappel (dans 10 secondes)</T>
          </Pressable>
        </Rise>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  seg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' },
  dot: { position: 'absolute', top: -4, width: 16, height: 16, marginLeft: -8, borderRadius: 8, backgroundColor: '#FFE7BE', shadowColor: C.goldBright, shadowOpacity: 1, shadowRadius: 10 },
  card: { marginTop: 26, borderRadius: 24, padding: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  step: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  onBtn: { height: 58, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(226,192,141,0.16)' },
});
