import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Mask, Rect } from 'react-native-svg';
import { C } from '../lib/theme';

/** Lune croissante qui brille doucement. */
export function Moon({ size = 140, color = C.peach }: { size?: number; color?: string }) {
  const glow = useRef(new Animated.Value(0)).current;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);
  const halo = size * 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute', width: halo, height: halo,
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
          transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
        }}
      >
        <Svg width={halo} height={halo}>
          <Defs>
            <RadialGradient id={`halo${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={C.orange} stopOpacity={0.55} />
              <Stop offset="0.45" stopColor={C.orange} stopOpacity={0.12} />
              <Stop offset="1" stopColor={C.orange} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={halo / 2} cy={halo / 2} r={halo / 2} fill={`url(#halo${uid})`} />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <Mask id={`cut${uid}`}>
            <Rect x="0" y="0" width="100" height="100" fill="white" />
            <Circle cx="64" cy="40" r="34" fill="black" />
          </Mask>
          <RadialGradient id={`moonfill${uid}`} cx="35%" cy="60%" r="70%">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor={color} />
          </RadialGradient>
        </Defs>
        <Circle cx="48" cy="52" r="38" fill={`url(#moonfill${uid})`} mask={`url(#cut${uid})`} />
      </Svg>
    </View>
  );
}
