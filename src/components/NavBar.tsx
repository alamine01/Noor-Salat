import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { Icon, IconName } from './Icon';

type Href = '/' | '/progres' | '/adhkar' | '/focus';
const LEFT: { href: Href; label: string; icon: IconName }[] = [
  { href: '/', label: 'Accueil', icon: 'home' },
  { href: '/progres', label: 'Progrès', icon: 'progress' },
];
const RIGHT: { href: Href; label: string; icon: IconName }[] = [
  { href: '/adhkar', label: 'Dhikr', icon: 'dhikr' },
  { href: '/focus', label: 'Focus', icon: 'moon' },
];

/** Barre du bas flottante, floutée, avec le bouton doré « scanner mon tapis » au centre. */
export function NavBar() {
  const path = usePathname();
  const { bottom } = useSafeAreaInsets();
  const item = (it: (typeof LEFT)[number]) => {
    const on = path === it.href;
    const col = on ? C.gold : C.faint;
    return (
      <Pressable key={it.href} style={st.item} accessibilityRole="tab" accessibilityLabel={it.label} accessibilityState={{ selected: on }}
        onPress={() => { if (!on) { haptic.tap(); router.replace(it.href); } }}>
        <Icon name={it.icon} size={22} color={col} />
        <Text style={{ fontFamily: F.medium, fontSize: 10, color: col, marginTop: 4 }}>{it.label}</Text>
      </Pressable>
    );
  };
  return (
    <View pointerEvents="box-none" style={[st.wrap, { bottom: Math.max(bottom, 12) + 4 }]}>
      <View style={st.bar}>
        {Platform.OS === 'web'
          ? <View style={[StyleSheet.absoluteFill, { backgroundColor: C.nav }]} />
          : <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,25,38,0.6)' }]} />}
        {LEFT.map(item)}
        <View style={st.item} />
        {RIGHT.map(item)}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Scanner mon tapis" onPress={() => { haptic.medium(); router.push('/scan'); }}
        style={({ pressed }) => [st.scan, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
        <LinearGradient colors={[C.goldBright, C.goldDeep]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
        <View style={{ zIndex: 1 }}><Icon name="qr" size={24} color={C.ink} stroke={1.9} /></View>
      </Pressable>
    </View>
  );
}

/** Hauteur à laisser libre en bas des écrans qui ont la barre. */
export const NAV_SPACE = 110;

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: { width: '100%', height: 68, borderRadius: 24, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  scan: {
    position: 'absolute', top: -26, width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.gold, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
});
