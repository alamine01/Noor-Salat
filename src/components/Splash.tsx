import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { C, F } from '../lib/theme';
import { Backdrop, HoldButton, ND, useBreath, useLoop } from './ui';
import { Text } from './Text';

const ACircle = Animated.createAnimatedComponent(Circle);
const WORD = ['N', 'o', 'o', 'r', ' ', 'S', 'a', 'l', 'â', 't'];

/**
 * Ouverture : rayons qui tournent, ن qui s'illumine, « Noor Salât » lettre par lettre.
 * Il faut garder le bouton appuyé pour entrer (sauf si `auto` : prière ou réveil en cours).
 */
export function Splash({ onDone, auto = false }: { onDone: () => void; auto?: boolean }) {
  const intro = useRef(new Animated.Value(0)).current; // 0 → 1 en 3 s (natif)
  const circleDash = useRef(new Animated.Value(540)).current; // tracé SVG (JS driver)
  const hold = useRef(new Animated.Value(0)).current; // remplissage du bouton
  const flash = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const spin = useLoop(40000);
  const breath = useBreath(4000);
  const leaving = useRef(false);

  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 650, easing: Easing.bezier(0.5, 0, 0.2, 1), useNativeDriver: ND }),
      Animated.timing(out, { toValue: 0, duration: 450, useNativeDriver: ND }),
    ]).start(() => onDone());
  }, [flash, out, onDone]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(intro, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: ND }),
      Animated.timing(circleDash, { toValue: 0, duration: 2300, delay: 200, easing: Easing.linear, useNativeDriver: false }),
    ]).start(() => { if (auto) leave(); });
  }, [intro, circleDash, auto, leave]);

  const at = (a: number, b: number) => intro.interpolate({ inputRange: [0, a, b, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
  const ease = hold.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 20, opacity: out, backgroundColor: C.bg }]}>
      <Backdrop />
      <View style={st.center} pointerEvents="none">
        <Animated.View style={{ position: 'absolute', opacity: at(0.1, 0.6) }}>
          <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
            <Svg width={760} height={760} viewBox="0 0 760 760">
              <Defs>
                <RadialGradient id="rays" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={C.gold} stopOpacity={0.22} />
                  <Stop offset="1" stopColor={C.gold} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <G fill="url(#rays)">
                <Path d="M380 380 L370 0 L390 0Z" /><Path d="M380 380 L760 370 L760 390Z" /><Path d="M380 380 L390 760 L370 760Z" /><Path d="M380 380 L0 390 L0 370Z" />
                <Path d="M380 380 L640 100 L655 115Z" /><Path d="M380 380 L660 640 L645 655Z" /><Path d="M380 380 L120 660 L105 645Z" /><Path d="M380 380 L100 120 L115 105Z" />
              </G>
            </Svg>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={[st.center, { top: -80 }]} pointerEvents="none">
        <Animated.View style={{
          position: 'absolute', width: 200, height: 200,
          opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
        }}>
          <Animated.View style={{
            width: '100%', height: '100%',
            transform: [{ scale: ease.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
          }}>
            <Svg width={200} height={200}>
              <Defs>
                <RadialGradient id="sh" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={C.goldBright} stopOpacity={0.45} />
                  <Stop offset="1" stopColor={C.goldBright} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width={200} height={200} fill="url(#sh)" />
            </Svg>
          </Animated.View>
        </Animated.View>
        <Animated.View style={{ width: 172, height: 172, alignItems: 'center', justifyContent: 'center', opacity: at(0.02, 0.35), transform: [{ scale: at(0.02, 0.45).interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
          <Svg width={172} height={172} style={StyleSheet.absoluteFill}>
            <ACircle cx={86} cy={86} r={84} fill="none" stroke={C.gold} strokeWidth={1.2} strokeDasharray="540 540"
              strokeDashoffset={circleDash} transform="rotate(-90 86 86)" />
            <ACircle cx={86} cy={86} r={84} fill="none" stroke="#FFF1D2" strokeWidth={3} strokeLinecap="round" strokeDasharray="528 528"
              strokeDashoffset={hold.interpolate({ inputRange: [0, 1], outputRange: [528, 0] })} transform="rotate(-90 86 86)" />
            <Circle cx={86} cy={2} r={3} fill={C.goldBright} />
          </Svg>
          <Text style={{ fontFamily: F.arabic, fontSize: 96, lineHeight: 150, color: C.goldBright, marginTop: -10 }}>ن</Text>
        </Animated.View>
      </View>

      <View style={{ position: 'absolute', top: '58%', left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
        <View style={{ flexDirection: 'row' }}>
          {WORD.map((l, i) => {
            const a = 0.3 + i * 0.022;
            const v = at(a, a + 0.2);
            return (
              <Animated.Text key={i} maxFontSizeMultiplier={1.2} style={{
                fontFamily: i > 4 ? F.serifItalic : F.serif, fontSize: 46, color: i > 4 ? C.gold : C.text, width: l === ' ' ? 12 : undefined,
                opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
              }}>{l === ' ' ? '' : l}</Animated.Text>
            );
          })}
        </View>
        <Animated.Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.arabic, fontSize: 22, color: C.dim, marginTop: 4, opacity: at(0.6, 0.8) }}>نور الصلاة</Animated.Text>
        <Animated.Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.regular, fontSize: 13, letterSpacing: 0.5, color: C.dim, marginTop: 14, opacity: at(0.72, 0.9) }}>Ta prière, ta lumière.</Animated.Text>
      </View>

      {!auto && (
        <Animated.View style={{ position: 'absolute', bottom: 64, left: 0, right: 0, alignItems: 'center', gap: 12, opacity: at(0.85, 1) }}>
          <HoldButton label="MAINTIENS POUR ENTRER" onDone={leave} onProgress={(p) => hold.setValue(p)} />
          <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.faint }}>Appui long sur le bouton</Text>
        </Animated.View>
      )}

      <View style={st.center} pointerEvents="none">
        <Animated.View style={{
          width: 900, height: 900, borderRadius: 450, opacity: flash.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 1] }),
          transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1.3] }) }],
        }}>
          <Svg width={900} height={900}>
            <Defs>
              <RadialGradient id="fl" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFF4DC" />
                <Stop offset="0.45" stopColor={C.goldBright} />
                <Stop offset="0.8" stopColor={C.bg} />
                <Stop offset="1" stopColor={C.bg} />
              </RadialGradient>
            </Defs>
            <Circle cx={450} cy={450} r={450} fill="url(#fl)" />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({ center: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' } });
