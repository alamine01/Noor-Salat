import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Path, LinearGradient as SvgLinear } from 'react-native-svg';
import { C } from '../lib/theme';

/** Fond « fluide » Zeena : noir, nappes violet / orange, arc lumineux. */
export function Fluid({ variant = 'night' }: { variant?: 'night' | 'bordeaux' | 'fajr' }) {
  const { width: w, height: h } = useWindowDimensions();
  const t = useRef(new Animated.Value(0)).current;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const base = variant === 'night' ? C.black : C.bordeaux;
  const warm = variant === 'night' ? C.gold : variant === 'fajr' ? '#FFC4A6' : C.orange;
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [10, -14] });
  const sc = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] }]}>
        <Svg width={w} height={h}>
          <Defs>
            <RadialGradient id={`warm${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={warm} stopOpacity={variant === 'night' ? 0.10 : 0.4} />
              <Stop offset="0.55" stopColor={variant === 'night' ? '#0E4A3A' : '#B33A12'} stopOpacity={variant === 'night' ? 0.3 : 0.15} />
              <Stop offset="1" stopColor={base} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`violet${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={variant === 'night' ? '#1F6B52' : '#C4B5FD'} stopOpacity={variant === 'night' ? 0.35 : 0.42} />
              <Stop offset="0.6" stopColor={variant === 'night' ? '#0E4A3A' : '#5B3FA8'} stopOpacity={0.14} />
              <Stop offset="1" stopColor={base} stopOpacity={0} />
            </RadialGradient>
            <SvgLinear id={`arc${uid}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={C.gold} stopOpacity={0} />
              <Stop offset="0.5" stopColor={variant === 'night' ? C.gold : C.orange} stopOpacity={variant === 'night' ? 0.25 : 0.55} />
              <Stop offset="1" stopColor="#E7C14A" stopOpacity={0.05} />
            </SvgLinear>
          </Defs>
          <Ellipse cx={w * 0.95} cy={h * 0.28} rx={w * 0.85} ry={h * 0.32} fill={`url(#warm${uid})`} />
          <Ellipse cx={w * 0.05} cy={h * 0.82} rx={w * 0.8} ry={h * 0.28} fill={`url(#violet${uid})`} />
          <Path
            d={`M ${w * 0.15} ${-h * 0.05} C ${w * 0.9} ${h * 0.05}, ${w * 1.05} ${h * 0.45}, ${w * 0.7} ${h * 1.05}`}
            stroke={`url(#arc${uid})`}
            strokeWidth={1.4}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
