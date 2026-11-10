import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ar, T } from './Text';
import { Icon } from './Icon';
import { Backdrop, Halo, ND, PrimaryButton, Rise } from './ui';
import { C, F } from '../lib/theme';

const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);

/** Écran « Prière validée » : éclat de lumière, coche qui se dessine, série qui passe à +1. */
export function Validated({ title, time, place, photo, doneToday, streakBefore, streakAfter, unlocked, onClose }: {
  title: string; time: string; place: string; photo?: string; doneToday: number; streakBefore: number; streakAfter: number; unlocked: boolean; onClose: () => void;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: false }).start();
  }, [t]);
  const seg = (a: number, b: number) => t.interpolate({ inputRange: [0, a, b, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
  const flip = seg(0.5, 0.62);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop top="#1D1A14" bottom="#07090F" />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
          <Halo size={300} opacity={0.32} duration={3000} />
          {[0, 0.1, 0.2].map((d, i) => {
            const v = seg(d, d + 0.6);
            return <Animated.View key={i} style={[st.burst, { opacity: v.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 0.9, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 3.2] }) }] }]} />;
          })}
          {Array.from({ length: 14 }).map((_, i) => {
            const v = seg(0.1 + (i % 4) * 0.02, 0.7);
            const a = (i * 360) / 14 + (i % 2) * 9;
            return (
              <View key={'p' + i} style={{ position: 'absolute', transform: [{ rotate: `${a}deg` }] }}>
                <Animated.View style={[st.particle, { opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -190] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) }] }]} />
              </View>
            );
          })}
          <Animated.View style={{ transform: [{ scale: seg(0, 0.25).interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 1.12, 1] }) }], opacity: seg(0, 0.1) }}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Circle cx={60} cy={60} r={52} fill="rgba(226,192,141,0.12)" />
              <ACircle cx={60} cy={60} r={52} fill="none" stroke={C.goldBright} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="330 330"
                strokeDashoffset={seg(0.05, 0.4).interpolate({ inputRange: [0, 1], outputRange: [330, 0] })} transform="rotate(-90 60 60)" />
              <APath d="M42 61l12 12 25-27" fill="none" stroke={C.goldBright} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40 40"
                strokeDashoffset={seg(0.32, 0.5).interpolate({ inputRange: [0, 1], outputRange: [40, 0] })} />
            </Svg>
          </Animated.View>
        </View>

        <Rise delay={700} style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: F.serif, fontSize: 46, lineHeight: 52, color: C.text }}>{title}</Text>
          <T style={{ color: C.dim, marginTop: 6, fontSize: 14 }}>{time} · {place}</T>
          <Ar style={{ fontSize: 24, marginTop: 14, color: C.goldBright }}>تقبّل الله</Ar>
          <Text style={{ fontFamily: F.serifItalic, fontSize: 18, color: C.soft }}>Qu'Allah l'accepte</Text>
        </Rise>

        <Rise delay={1000} style={st.card}>
          <View style={{ gap: 12 }}>
            <T style={{ fontSize: 12, color: C.dim }}>Aujourd'hui</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const isNew = i === doneToday - 1;
                if (i < doneToday - 1) return <View key={i} style={[st.d, { backgroundColor: C.gold }]} />;
                if (isNew) return (
                  <View key={i} style={[st.d, { borderWidth: 1.5, borderColor: C.gold }]}>
                    <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 7, backgroundColor: C.gold, opacity: seg(0.6, 0.7), transform: [{ scale: seg(0.6, 0.7) }] }]} />
                  </View>
                );
                return <View key={i} style={[st.d, { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' }]} />;
              })}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="flame" size={22} color={C.gold} stroke={1.8} />
            <View style={{ height: 44, overflow: 'hidden' }}>
              <Animated.View style={{ transform: [{ translateY: flip.interpolate({ inputRange: [0, 1], outputRange: [0, streakAfter !== streakBefore ? -44 : 0] }) }] }}>
                <Text style={st.num}>{streakBefore}</Text>
                <Text style={[st.num, { color: C.goldBright }]}>{streakAfter}</Text>
              </Animated.View>
            </View>
            <T style={{ fontSize: 13, color: C.dim }}>{streakAfter > 1 ? 'jours' : 'jour'}</T>
          </View>
        </Rise>

        {unlocked && (
          <Rise delay={1300} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 18 }}>
            <Icon name="unlock" size={16} color={C.gold} stroke={1.8} />
            <T style={{ fontSize: 13, color: C.soft }}>Tes applis sont débloquées</T>
          </Rise>
        )}
        {photo ? null : null}
        <View style={{ flex: 1 }} />
        <Rise delay={1500} style={{ paddingBottom: 16 }}>
          <PrimaryButton title="Retour à l'accueil" onPress={onClose} />
        </Rise>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  burst: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, borderColor: 'rgba(243,217,164,0.7)' },
  particle: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.goldBright, shadowColor: C.goldBright, shadowOpacity: 1, shadowRadius: 6 },
  card: { marginTop: 26, borderRadius: 24, paddingVertical: 18, paddingHorizontal: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  d: { width: 14, height: 14, borderRadius: 7, overflow: 'hidden' },
  num: { height: 44, fontSize: 36, lineHeight: 44, fontFamily: F.light, color: C.text, fontVariant: ['tabular-nums'] },
});
