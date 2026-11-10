import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinear, RadialGradient, Rect, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { C, F, R } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { Icon, IconName } from './Icon';
import { T } from './Text';

export const ND = Platform.OS !== 'web'; // useNativeDriver

/* ---------- Animations ---------- */

/** Valeur 0 → 1 → 0 qui boucle (respiration, halo, scintillement). */
export function useBreath(duration = 5000, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      Animated.timing(v, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay]);
  return v;
}

/** Valeur 0 → 1 qui recommence (rotation, ligne de scan, ondes). */
export function useLoop(duration = 3000, delay = 0, easing = Easing.linear) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: ND }),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: ND }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay, easing]);
  return v;
}

/** Apparition : monte et s'éclaire, avec un délai. */
export function Rise({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 800, delay, easing: Easing.bezier(0.2, 0.7, 0.2, 1), useNativeDriver: ND }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Halo doré flou qui respire. */
export function Halo({ size, opacity = 0.35, duration = 5000, style }: { size: number; opacity?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const b = useBreath(duration);
  const id = useRef('h' + Math.random().toString(36).slice(2, 8)).current;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style, {
      opacity: b.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
      transform: [{ scale: b.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
    }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={C.goldBright} stopOpacity={opacity} />
            <Stop offset="1" stopColor={C.goldBright} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** Ondes qui s'élargissent autour d'un point. */
export function Ripples({ size, count = 3, duration = 6000, color = 'rgba(243,217,164,0.5)' }: { size: number; count?: number; duration?: number; color?: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size }}>
      {Array.from({ length: count }).map((_, i) => <Ripple key={i} size={size} duration={duration} delay={(duration / count) * i} color={color} />)}
    </View>
  );
}
function Ripple({ size, duration, delay, color }: { size: number; duration: number; delay: number; color: string }) {
  const v = useLoop(duration, delay, Easing.out(Easing.quad));
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: color,
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.3] }) }],
    }} />
  );
}

/* ---------- Fond ---------- */

const STARS = [[34, 140, 0], [300, 120, 1.2], [352, 210, 2.1], [22, 330, 0.6], [368, 380, 3], [60, 250, 1.8], [330, 300, 0.3], [190, 140, 2.6], [110, 170, 1.1], [280, 460, 2.2], [40, 450, 3.4], [250, 96, 0.9], [150, 560, 1.5], [350, 560, 2.8]];

function Star({ x, y, d }: { x: number; y: number; d: number }) {
  const b = useBreath(4000, d * 1000);
  return <Animated.View style={{ position: 'absolute', left: `${(x / 390) * 100}%`, top: y, width: 2, height: 2, borderRadius: 1, backgroundColor: C.text, opacity: b.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.85] }) }} />;
}

/** Fond nuit : dégradé radial + étoiles qui scintillent. */
export function Backdrop({ stars = false, top = C.bgTop, bottom = C.bg }: { stars?: boolean; top?: string; bottom?: string }) {
  const id = useRef('b' + Math.random().toString(36).slice(2, 8)).current;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="22%" rx="95%" ry="60%">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {stars && STARS.map(([x, y, d], i) => <Star key={i} x={x} y={y} d={d} />)}
    </View>
  );
}

/* ---------- Anneau de progression ---------- */

const ACircle = Animated.createAnimatedComponent(Circle);

/** Anneau doré qui se dessine jusqu'à `value` (0 → 1). */
export function Ring({ size, stroke = 3, value, track = 'rgba(255,255,255,0.07)', duration = 1200, children, gradient = true }: {
  size: number; stroke?: number; value: number; track?: string; duration?: number; children?: ReactNode; gradient?: boolean;
}) {
  const r = (size - stroke * 2 - 4) / 2;
  const c = 2 * Math.PI * r;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: Math.max(0, Math.min(1, value)), duration, easing: Easing.bezier(0.3, 0.7, 0.2, 1), useNativeDriver: false }).start();
  }, [v, value, duration]);
  const id = useRef('rg' + Math.random().toString(36).slice(2, 8)).current;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.goldBright} />
            <Stop offset="1" stopColor="#B8925A" />
          </SvgLinear>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <ACircle cx={size / 2} cy={size / 2} r={r} stroke={gradient ? `url(#${id})` : C.gold} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={v.interpolate({ inputRange: [0, 1], outputRange: [c, 0] })}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      {children}
    </View>
  );
}

/* ---------- Boutons ---------- */

/** Bouton plein crème (action principale). */
export function PrimaryButton({ title, onPress, icon, style, gold, disabled }: { title: string; onPress?: () => void; icon?: IconName; style?: StyleProp<ViewStyle>; gold?: boolean; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} accessibilityRole="button" onPress={() => { haptic.light(); onPress?.(); }}
      style={({ pressed }) => [s.primary, { backgroundColor: gold ? C.gold : C.text, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      {icon && <Icon name={icon} size={20} color={C.ink} stroke={2} />}
      <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{title}</Text>
    </Pressable>
  );
}

/** Bouton contour discret. */
export function GhostButton({ title, onPress, icon, style, color = C.text }: { title: string; onPress?: () => void; icon?: IconName; style?: StyleProp<ViewStyle>; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => { haptic.tap(); onPress?.(); }}
      style={({ pressed }) => [s.ghost, { opacity: pressed ? 0.7 : 1 }, style]}>
      {icon && <Icon name={icon} size={18} color={C.gold} stroke={1.8} />}
      <Text style={{ fontFamily: F.medium, fontSize: 14, color }}>{title}</Text>
    </Pressable>
  );
}

/** Bouton rond (retour, réglages…). */
export function IconButton({ icon, onPress, label, style }: { icon: IconName; onPress?: () => void; label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={() => { haptic.tap(); onPress?.(); }}
      style={({ pressed }) => [s.iconBtn, { opacity: pressed ? 0.7 : 1 }, style]}>
      <Icon name={icon} size={20} color={C.text} stroke={1.7} />
    </Pressable>
  );
}

export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/* ---------- Conteneurs ---------- */

export function Card({ children, style, gold }: { children: ReactNode; style?: StyleProp<ViewStyle>; gold?: boolean }) {
  return <View style={[s.card, gold && { backgroundColor: 'rgba(226,192,141,0.07)', borderColor: 'rgba(226,192,141,0.28)' }, style]}>{children}</View>;
}

/** Ligne de réglage : titre + sous-titre + élément à droite. */
export function Row({ title, sub, right, onPress, last, icon }: { title: string; sub?: string; right?: ReactNode; onPress?: () => void; last?: boolean; icon?: ReactNode }) {
  const inner = (
    <>
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <T style={{ fontSize: 14 }}>{title}</T>
        {sub ? <T style={{ fontSize: 11.5, color: C.dim }}>{sub}</T> : null}
      </View>
      {right}
    </>
  );
  const st = [s.row, !last && s.rowLine];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={() => { haptic.tap(); onPress(); }} style={({ pressed }) => [...st, { opacity: pressed ? 0.7 : 1 }]}>{inner}</Pressable>
  ) : <View style={st}>{inner}</View>;
}

/** Interrupteur doré animé. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  const v = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: value ? 1 : 0, duration: 280, easing: Easing.bezier(0.3, 0.7, 0.2, 1), useNativeDriver: false }).start();
  }, [v, value]);
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} hitSlop={8}
      onPress={() => { haptic.tap(); onChange(!value); }}>
      <Animated.View style={[s.track, { backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.12)', C.gold] }) }]}>
        <Animated.View style={[s.knob, { transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) }] }]} />
      </Animated.View>
    </Pressable>
  );
}

/** Pastille sélectionnable. */
export function Chip({ label, on, onPress, style }: { label: string; on: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { haptic.tap(); onPress(); }}
      style={[s.chip, { backgroundColor: on ? C.gold : C.surface2 }, style]}>
      <Text style={{ fontFamily: F.medium, fontSize: 13, color: on ? C.ink : C.soft }}>{label}</Text>
    </Pressable>
  );
}

/** Sélecteur à onglets. */
export function Segmented({ items, value, onChange }: { items: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <View style={s.seg}>
      {items.map((it, i) => (
        <Pressable key={it} accessibilityRole="tab" accessibilityState={{ selected: i === value }} onPress={() => { haptic.tap(); onChange(i); }}
          style={[s.segItem, i === value && { backgroundColor: C.gold }]}>
          <Text style={{ fontFamily: F.medium, fontSize: 13, color: i === value ? C.ink : C.soft }}>{it}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- Bouton à maintenir ---------- */

/**
 * Bouton qu'il faut garder appuyé : il se remplit d'or, vibre de plus en plus fort,
 * puis déclenche `onDone`. Si on lâche avant, il se vide.
 */
export function HoldButton({ label, onDone, duration = 1400, width = 250, onProgress, style }: {
  label: string; onDone: () => void; duration?: number; width?: number; onProgress?: (p: number) => void; style?: StyleProp<ViewStyle>;
}) {
  const p = useRef(new Animated.Value(0)).current;
  const cur = useRef(0);
  const done = useRef(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    const id = p.addListener(({ value }) => { cur.current = value; onProgress?.(value); });
    return () => { p.removeListener(id); if (tick.current) clearInterval(tick.current); };
  }, [p, onProgress]);

  function start() {
    if (done.current) return;
    setHolding(true);
    haptic.light();
    Animated.timing(p, { toValue: 1, duration: duration * (1 - cur.current), easing: Easing.linear, useNativeDriver: false }).start(({ finished }) => {
      if (finished && !done.current) {
        done.current = true;
        if (tick.current) clearInterval(tick.current);
        setHolding(false);
        haptic.success();
        onDone();
        setTimeout(() => { done.current = false; p.setValue(0); }, 1500);
      }
    });
    // Vibrations de plus en plus fortes pendant l'appui.
    if (tick.current) clearInterval(tick.current);
    tick.current = setInterval(() => {
      const v = cur.current;
      if (v < 0.4) haptic.light(); else if (v < 0.8) haptic.medium(); else haptic.heavy();
    }, 140);
  }
  function stop() {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
    setHolding(false);
    if (done.current) return;
    Animated.timing(p, { toValue: 0, duration: (duration / 2.5) * cur.current, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }

  const fillW = p.interpolate({ inputRange: [0, 1], outputRange: [0, width] });
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Garde le doigt appuyé"
      onPressIn={start} onPressOut={stop} delayLongPress={100000}
      style={[{ width, height: 58, borderRadius: 29, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(226,192,141,0.35)', backgroundColor: 'rgba(255,255,255,0.03)', transform: [{ scale: holding ? 0.97 : 1 }] }, style]}>
      <View style={[StyleSheet.absoluteFill, s.center]}><Text style={s.holdTxt}>{label}</Text></View>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fillW, overflow: 'hidden', backgroundColor: C.gold }}>
        <View style={[{ width, height: 58 }, s.center]}><Text style={[s.holdTxt, { color: C.ink }]}>{label}</Text></View>
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Divers ---------- */

/** Barre de lecture du statut (permissions, filtre…). */
export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? C.gold : 'rgba(232,168,124,0.15)' }}>
      {ok ? <Icon name="check" size={14} color={C.ink} stroke={2.8} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.warn }} />}
    </View>
  );
}

export const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  primary: { height: 58, borderRadius: R.btn, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ghost: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: C.line2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: R.card, paddingHorizontal: 18, paddingVertical: 4, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  track: { width: 46, height: 28, borderRadius: 14, padding: 3 },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.text },
  chip: { height: 40, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  seg: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)' },
  segItem: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  holdTxt: { fontFamily: F.semibold, fontSize: 12, letterSpacing: 2.4, color: C.soft },
});
