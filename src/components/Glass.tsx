import { BlurView } from 'expo-blur';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { C } from '../lib/theme';

/** Carte en verre dépoli (glassmorphism). */
export function Glass({ children, style, tint }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return (
    <View style={[s.wrap, tint ? { borderColor: tint } : null, style]}>
      <BlurView
        intensity={28}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.glass }]} />
      <View style={s.inner}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: C.glassBorder, overflow: 'hidden' },
  inner: { padding: 18 },
});
