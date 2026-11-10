import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import { Ar, T } from '../components/Text';
import { Icon } from '../components/Icon';
import { GhostButton, ND, PrimaryButton, Ring, Rise, useBreath } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { dateCourte } from '../lib/format';
import { FajrSettings, getFajr } from '../lib/store';
import { loadTodayTimes } from '../lib/prayer';
import { startAlarm, stopAlarm } from '../lib/alarm';
import { unlock } from '../lib/blocker';
import { playWoosh } from '../lib/sounds';
import { createSquatCounter } from '../lib/squats';
import { alarmKitAuthorized, isIOS } from '../lib/ios';

const GOAL = 10;
const AUDIO_NAME: Record<FajrSettings['audio'], string> = { khayr: 'As-salātu khayrun mina-n-nawm', adhan_fajr: 'Adhan du Fajr', systeme: 'Sonnerie du téléphone' };

export default function FajrRing() {
  const { step, test } = useLocalSearchParams<{ step?: 'squats'; test?: string }>();
  const [now, setNow] = useState(new Date());
  const [settings, setSettings] = useState<FajrSettings | null>(null);
  const [fajr, setFajr] = useState('');
  const [torch, setTorch] = useState(false);
  const [ringing, setRinging] = useState(true); // son + vibration + lampe tant que le réveil n'est pas arrêté
  const [focused, setFocused] = useState(true); // écran visible (pas caché sous le scan)
  const [squats, setSquats] = useState(0);
  const [perm] = useCameraPermissions();
  const dawn = useRef(new Animated.Value(0)).current;
  const flash = useBreath(1200);

  useEffect(() => {
    getFajr().then((s) => {
      setSettings(s);
      // iPhone avec AlarmKit : le réveil a déjà sonné (écran Apple) ; ici on attend juste le scan.
      // iPhone avec un vrai réveil AlarmKit : il a déjà sonné (écran Apple), pas de second son ici.
      (isIOS && !test ? alarmKitAuthorized() : Promise.resolve(false)).then((ak) => { if (!ak) startAlarm(s.audio); });
    });
    loadTodayTimes().then((d) => setFajr(d.times.Fajr)).catch(() => {});
    Animated.timing(dawn, { toValue: 1, duration: 9000, easing: Easing.out(Easing.quad), useNativeDriver: ND }).start();
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [dawn, test]);

  // La lampe torche clignote tant que le réveil sonne (si la caméra est autorisée), et s'éteint avec lui.
  useEffect(() => {
    if (!ringing || !focused) { setTorch(false); return; }
    const tid = setInterval(() => setTorch((t) => !t), 800);
    return () => { clearInterval(tid); setTorch(false); };
  }, [ringing, focused]);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => { sub.remove(); setFocused(false); };
  }, []));

  // Compteur de squats avec l'accéléromètre (descente puis remontée = 1).
  useEffect(() => {
    if (step !== 'squats' || Platform.OS === 'web') return;
    const feed = createSquatCounter(() => { setSquats((n) => n + 1); haptic.medium(); });
    Accelerometer.setUpdateInterval(50);
    const sub = Accelerometer.addListener(({ x, y, z }) => feed(x, y, z));
    return () => sub.remove();
  }, [step]);

  const finish = useCallback(() => {
    setRinging(false);
    stopAlarm();
    unlock('Fajr');
    playWoosh();
    // On laisse à la lampe le temps de s'éteindre avant de quitter l'écran.
    setTimeout(() => router.dismissTo('/'), 300);
  }, []);

  useEffect(() => {
    if (step === 'squats' && squats >= GOAL) { haptic.success(); stopAlarm(); setRinging(false); }
  }, [squats, step]);

  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const sq = step === 'squats';
  const doneSq = sq && squats >= GOAL;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#05070F', '#0D1430', '#2B2344', '#5A3A3E']} locations={[0, 0.45, 0.7, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -100, right: -100, bottom: -120, height: 520,
        opacity: dawn.interpolate({ inputRange: [0, 1], outputRange: [0.25, sq ? 0.35 + (squats / GOAL) * 0.65 : 1] }),
        transform: [{ translateY: dawn.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] }}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="dawn" cx="50%" cy="100%" rx="50%" ry="55%">
              <Stop offset="0" stopColor="#FFBE78" stopOpacity={0.85} />
              <Stop offset="0.35" stopColor="#E88C64" stopOpacity={0.45} />
              <Stop offset="1" stopColor="#784664" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dawn)" />
        </Svg>
      </Animated.View>
      {!sq && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', bottom: 150, width: 160, height: 80, overflow: 'hidden',
          transform: [{ translateY: dawn.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }] }}>
          <Svg width={160} height={160}>
            <Defs>
              <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFE7BE" />
                <Stop offset="0.45" stopColor="#FFC98A" />
                <Stop offset="1" stopColor="#FFC98A" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={80} cy={80} r={80} fill="url(#sun)" />
          </Svg>
        </Animated.View>
      )}
      <Svg width="100%" height={180} viewBox="0 0 390 180" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', bottom: 0 }} pointerEvents="none">
        <Path d="M0 110h40v-20h14v20h30v-30a26 26 0 0 1 52 0v30h20V40l5-12 5 12v70h40v-18a18 18 0 0 1 36 0v18h40V60l4-10 4 10v50h50v-16h16v16h34v70H0z" fill="#07090F" />
        <Path d="M0 150h390v30H0z" fill="#07090F" />
      </Svg>
      {ringing && !sq && <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: C.goldBright, opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }) }]} />}
      {/* Toujours montée sur cet écran : on éteint la lampe proprement au lieu de couper la caméra en plein flash. */}
      {perm?.granted && Platform.OS !== 'web' && focused && (
        <CameraView style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }} enableTorch={ringing && torch} />
      )}

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
        {!sq ? (
          <>
            <Rise style={{ alignItems: 'center', marginTop: 12 }}>
              <View style={st.pill}>
                <Icon name="bell" size={15} color={C.goldBright} stroke={1.8} />
                <T style={{ fontSize: 12, color: C.soft }}>Réveil Fajr{settings ? ` · ${AUDIO_NAME[settings.audio]}` : ''}{test ? ' · test' : ''}</T>
              </View>
            </Rise>
            <Rise delay={200} style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontFamily: F.thin, fontSize: 104, lineHeight: 112, letterSpacing: -2, color: C.text, fontVariant: ['tabular-nums'] }}>{time}</Text>
              <T style={{ fontSize: 14, color: C.soft, marginTop: 6 }}>{fajr ? `Fajr à ${fajr} · ` : ''}{dateCourte(now)}</T>
            </Rise>
            <Rise delay={500} style={{ alignItems: 'center', marginTop: 34 }}>
              <Ar style={{ fontSize: 30, lineHeight: 46, color: C.goldBright }}>الصلاة خير من النوم</Ar>
              <Text style={{ fontFamily: F.serifItalic, fontSize: 20, color: '#E6E1D6' }}>La prière vaut mieux que le sommeil</Text>
              <Bars />
              <T style={{ fontSize: 12, color: C.soft, marginTop: 8 }}>Le volume monte doucement</T>
            </Rise>
            <View style={{ flex: 1 }} />
            <Rise delay={800} style={{ gap: 10, paddingBottom: 14 }}>
              {settings?.squats && <T style={st.note}>Puis 10 squats pour bien te réveiller</T>}
              <PrimaryButton icon="qr" title="Scanner mon tapis pour arrêter" onPress={() => router.push({ pathname: '/scan', params: { prayer: 'Fajr', from: 'fajr' } })} />
              {test && settings?.squats && <GhostButton title="Passer aux squats (test)" color={C.goldBright} onPress={() => router.setParams({ step: 'squats' })} />}
              {test && <GhostButton title="Arrêter le test" onPress={finish} />}
            </Rise>
          </>
        ) : (
          <>
            <Rise style={{ alignItems: 'center', marginTop: 16 }}>
              <Ar style={{ fontSize: 22 }}>الفجر</Ar>
              <Text style={{ fontFamily: F.serif, fontSize: 34, color: C.text }}>{doneSq ? 'Bien réveillé !' : 'Encore un effort'}</Text>
              <T style={{ fontSize: 13, color: C.soft, marginTop: 6, textAlign: 'center' }}>
                {doneSq ? "Le réveil est arrêté. Qu'Allah bénisse ta journée." : 'Fais 10 squats, téléphone en main, pour arrêter le réveil.'}
              </T>
            </Rise>
            <View style={{ alignItems: 'center', marginTop: 34 }}>
              <Ring size={260} stroke={6} value={squats / GOAL} duration={450} gradient={false}>
                <Squatter />
              </Ring>
              <Count n={Math.min(squats, GOAL)} />
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ gap: 10, paddingBottom: 14 }}>
              {doneSq ? <PrimaryButton title="Commencer ma journée" onPress={finish} /> : (Platform.OS === 'web' || __DEV__) && (
                <GhostButton title="+1 squat (test)" onPress={() => { haptic.medium(); setSquats((n) => n + 1); }} />
              )}
              {!doneSq && <T style={{ fontSize: 12, color: C.dim, textAlign: 'center' }}>Le téléphone compte tout seul grâce à ses capteurs.</T>}
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function Bars() {
  const h = [10, 18, 26, 14, 28, 20, 24, 12, 18];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 28, marginTop: 22 }}>
      {h.map((v, i) => <Bar key={i} h={v} delay={i * 110} />)}
    </View>
  );
}
function Bar({ h, delay }: { h: number; delay: number }) {
  const b = useBreath(1100, delay);
  return <Animated.View style={{ width: 4, height: h, borderRadius: 2, backgroundColor: C.goldBright, transform: [{ scaleY: b.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }] }} />;
}

function Squatter() {
  const b = useBreath(1600);
  return (
    <Animated.View style={{ position: 'absolute', transform: [{ translateY: b.interpolate({ inputRange: [0, 1], outputRange: [-8, 14] }) }] }}>
      <Svg width={120} height={140} viewBox="0 0 120 140">
        <Circle cx={60} cy={30} r={10} fill="none" stroke={C.text} strokeWidth={4} />
        <Path d="M60 42 V92 M40 60 H80 M60 92 L50 126 M60 92 L70 126" fill="none" stroke={C.text} strokeWidth={4} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

function Count({ n }: { n: number }) {
  const s = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    s.setValue(1.25);
    Animated.timing(s, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(2)), useNativeDriver: ND }).start();
  }, [n, s]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 18 }}>
      <Animated.Text style={{ fontFamily: F.thin, fontSize: 72, color: C.text, fontVariant: ['tabular-nums'], transform: [{ scale: s }] }}>{n}</Animated.Text>
      <Text style={{ fontFamily: F.light, fontSize: 22, color: C.dim }}> / {GOAL}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  note: { alignSelf: 'center', fontSize: 12, color: '#E6E1D6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(7,9,15,0.5)', overflow: 'hidden' },
});
