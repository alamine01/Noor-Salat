import { useCallback, useEffect, useState } from 'react';
import { Animated, BackHandler, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, G, Path, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Ar, Label, Serif, T } from '../components/Text';
import { Icon } from '../components/Icon';
import { Backdrop, GhostButton, Ripples, Rise, useBreath, useLoop } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { DayTimes, PRAYERS, currentPrayer, loadTodayTimes } from '../lib/prayer';
import { RAPPELS, Rappel, nextRappel } from '../lib/rappels';


export default function Block() {
  const [day, setDay] = useState<DayTimes | null>(null);
  const [prayer, setPrayer] = useState(PRAYERS[1]);
  const [rappel, setRappel] = useState<Rappel>(RAPPELS[0]);
  useEffect(() => {
    loadTodayTimes().then((d) => { setDay(d); setPrayer(currentPrayer(d.times) ?? PRAYERS[0]); });
  }, []);
  // Le bouton retour d'Android ne ferme pas l'écran : il faut scanner le tapis.
  // Chaque fois que l'écran revient (l'utilisateur rouvre une appli bloquée) : un nouveau rappel.
  useFocusEffect(useCallback(() => {
    nextRappel('priere').then(setRappel);
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []));

  const spin = useLoop(60000);
  const orb = useBreath(6000);
  const sheen = useLoop(3500, 600);

  return (
    <View style={{ flex: 1, backgroundColor: '#05060B' }}>
      <Backdrop stars top="#1A1B2E" bottom="#05060B" />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center' }]} pointerEvents="none">
        <Animated.View style={{ position: 'absolute', top: -60, opacity: 0.7, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
          <Svg width={640} height={640} viewBox="0 0 640 640">
            <Defs>
              <RadialGradient id="br" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={C.goldBright} stopOpacity={0.18} />
                <Stop offset="1" stopColor={C.goldBright} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <G fill="url(#br)">
              <Path d="M320 320 312 0h16z" /><Path d="M320 320 640 312v16z" /><Path d="M320 320 328 640h-16z" /><Path d="M320 320 0 328v-16z" />
              <Path d="M320 320 540 90l12 12z" /><Path d="M320 320 550 540l-12 12z" /><Path d="M320 320 100 550l-12-12z" /><Path d="M320 320 90 100l12-12z" />
            </G>
          </Svg>
        </Animated.View>
      </View>

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
        <Rise style={{ alignItems: 'center', marginTop: 12 }}>
          <View style={st.pill}>
            <Icon name="lock" size={14} color={C.gold} stroke={1.8} />
            <T style={{ fontSize: 12, color: C.soft }}>Tes applis sont en pause</T>
          </View>
        </Rise>

        <View style={{ alignItems: 'center', justifyContent: 'center', height: 220 }}>
          <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
            <Ripples size={140} />
            <Animated.View style={{
              width: 140, height: 140, opacity: orb.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
              transform: [{ scale: orb.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }],
            }}>
              <Svg width={140} height={140}>
                <Defs>
                  <RadialGradient id="orb" cx="40%" cy="35%" r="60%">
                    <Stop offset="0" stopColor="#FFF4DC" />
                    <Stop offset="0.35" stopColor={C.goldBright} />
                    <Stop offset="0.8" stopColor={C.goldDeep} />
                    <Stop offset="1" stopColor={C.goldDeep} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={70} cy={70} r={70} fill="url(#orb)" />
              </Svg>
            </Animated.View>
          </View>
        </View>

        <Rise delay={300} style={{ alignItems: 'center' }}>
          <Label>C'est l'heure de</Label>
          <Serif style={{ fontSize: 76, lineHeight: 84, marginTop: 6 }}>{prayer.fr}</Serif>
          <T style={{ fontSize: 14, color: C.dim, marginTop: 2 }}>{day ? `${day.times[prayer.key]} · ${day.city}` : ' '}</T>
        </Rise>

        <Rise key={rappel.fr} delay={600} style={{ alignItems: 'center', marginTop: 22, paddingHorizontal: 8 }}>
          {rappel.ar && <Ar style={{ fontSize: 22, lineHeight: 40, color: C.goldBright, textAlign: 'center' }}>{rappel.ar}</Ar>}
          <Text style={{ fontFamily: F.serifItalic, fontSize: 17, lineHeight: 24, color: C.soft, textAlign: 'center', marginTop: 6 }}>
            « {rappel.fr} »
          </Text>
          <T style={{ fontSize: 11, letterSpacing: 1.6, color: C.faint, marginTop: 6 }}>{rappel.ref.toUpperCase()}</T>
        </Rise>

        <View style={{ flex: 1 }} />
        <Rise delay={900} style={{ gap: 10, paddingBottom: 12 }}>
          <Pressable accessibilityRole="button" onPress={() => { haptic.medium(); router.push({ pathname: '/scan', params: { prayer: prayer.key, from: 'block' } }); }}
            style={({ pressed }) => [st.cta, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <LinearGradient colors={[C.gold, '#F6E3BC', C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: 80, opacity: 0.55, transform: [{ translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-120, 420] }) }, { skewX: '-20deg' }] }}>
              <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </Animated.View>
            <View style={{ zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="qr" size={20} color={C.ink} stroke={2} />
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>J'ai prié · scanner mon tapis</Text>
            </View>
          </Pressable>
          <GhostButton title="Pas de tapis ici ? Lire 5 versets" color={C.soft} onPress={() => router.push({ pathname: '/versets', params: { prayer: prayer.key } })} />
          <Pressable onPress={() => Linking.openURL('tel:').catch(() => {})} accessibilityRole="button" style={{ alignSelf: 'center', padding: 10, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Icon name="phone" size={13} color={C.faint} />
            <T style={{ fontSize: 12, color: C.faint }}>Appel d'urgence</T>
          </Pressable>
        </Rise>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cta: { height: 58, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
