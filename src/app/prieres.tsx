import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText, Line } from 'react-native-svg';
import { Screen } from '../components/Screen';
import { PageHeader } from '../components/PageHeader';
import { Ar, T } from '../components/Text';
import { Icon } from '../components/Icon';
import { Rise, useBreath } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { dateCourte, duree } from '../lib/format';
import { CALC, DayTimes, PRAYERS, loadTodayTimes, nextPrayer, toDate } from '../lib/prayer';
import { getDayLogs, PrayerLog } from '../lib/store';

const APath = Animated.createAnimatedComponent(Path);
const ARC = Math.PI * 140;

export default function Prieres() {
  const [day, setDay] = useState<DayTimes | null>(null);
  const [logs, setLogs] = useState<PrayerLog[]>([]);
  const [now, setNow] = useState(new Date());
  useFocusEffect(useCallback(() => {
    loadTodayTimes().then(setDay);
    getDayLogs().then(setLogs);
  }, []));
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);

  const next = day ? nextPrayer(day.times, now) : null;
  // Position sur l'arc : 0 = Fajr, 1 = Isha.
  const t0 = day ? toDate(day.times.Fajr, now).getTime() : 0;
  const t1 = day ? toDate(day.times.Isha, now).getTime() : 1;
  const frac = (hm: string) => Math.max(0, Math.min(1, (toDate(hm, now).getTime() - t0) / (t1 - t0)));
  const pt = (f: number) => ({ x: 170 - 140 * Math.cos(Math.PI * f), y: 150 - 140 * Math.sin(Math.PI * f) });
  const nowF = day ? Math.max(0, Math.min(1, (now.getTime() - t0) / (t1 - t0))) : 0;
  const sun = pt(nowF);

  const draw = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!day) return;
    Animated.timing(draw, { toValue: nowF, duration: 1800, easing: Easing.bezier(0.3, 0.7, 0.2, 1), useNativeDriver: false }).start();
  }, [day, nowF, draw]);
  const pulse = useBreath(2400);

  const rows = [
    ...PRAYERS.map((p) => ({ ...p, time: day?.times[p.key] ?? '--:--', info: false })),
    ...(day?.sunrise ? [{ key: 'Sunrise', fr: 'Chourouq', ar: 'الشروق', time: day.sunrise, info: true }] : []),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Screen nav={false}>
      <PageHeader title="Prières du jour" subtitle={`${dateCourte(now)}${day?.hijri ? ' · ' + day.hijri : ''}`} />

      <Rise delay={100} style={{ alignSelf: 'center', width: 340, height: 170 }}>
        <Svg width={340} height={170} viewBox="0 0 340 170">
          <Defs>
            <LinearGradient id="ag" x1="0" x2="1" y1="0" y2="0"><Stop offset="0" stopColor="#B8925A" /><Stop offset="1" stopColor={C.goldBright} /></LinearGradient>
          </Defs>
          <Path d="M30 150 A140 140 0 0 1 310 150" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} strokeDasharray="3 6" />
          <APath d="M30 150 A140 140 0 0 1 310 150" fill="none" stroke="url(#ag)" strokeWidth={2.5} strokeLinecap="round" strokeDasharray={`${ARC} ${ARC}`}
            strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [ARC, 0] })} />
          <Line x1={10} y1={150} x2={330} y2={150} stroke="rgba(255,255,255,0.1)" />
          {day && PRAYERS.map((p) => {
            const q = pt(frac(day.times[p.key]));
            const passed = toDate(day.times[p.key], now) <= now;
            return <Circle key={p.key} cx={q.x} cy={q.y} r={4} fill={passed ? C.gold : C.bg} stroke={passed ? C.gold : 'rgba(255,255,255,0.3)'} strokeWidth={1.5} />;
          })}
          {day && <Circle cx={sun.x} cy={sun.y} r={6} fill="#FFE7BE" />}
          <SvgText x={30} y={166} fill={C.dim} fontSize={10} textAnchor="middle">Fajr</SvgText>
          <SvgText x={310} y={166} fill={C.dim} fontSize={10} textAnchor="middle">Isha</SvgText>
        </Svg>
        {day && (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: sun.x - 13, top: sun.y - 13, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(243,217,164,0.35)',
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) }], opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.4] }) }} />
        )}
      </Rise>

      <Rise delay={250} style={{ gap: 8 }}>
        {rows.map((r) => {
          const done = logs.find((l) => l.prayer === r.key);
          const passed = toDate(r.time, now) <= now;
          const isNext = !r.info && next?.key === r.key && !done;
          const sub = r.info ? 'Lever du soleil' : done
            ? `Validée à ${new Date(done.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · ${done.method === 'versets' ? 'versets' : 'tapis'}`
            : isNext && next ? `Dans ${duree((next.at.getTime() - now.getTime()) / 1000)} · touche pour scanner`
            : passed ? 'À rattraper · touche pour scanner' : 'À venir';
          return (
            <Pressable key={r.key} disabled={r.info} accessibilityRole="button" accessibilityLabel={`${r.fr} ${r.time}, ${sub}`}
              onPress={() => { haptic.tap(); router.push({ pathname: '/scan', params: { prayer: r.key } }); }}
              style={[st.row, isNext && st.rowNext, r.info && { backgroundColor: 'transparent', borderColor: 'transparent' }]}>
              <View style={{ width: 28, alignItems: 'center' }}>
                {r.info ? <Icon name="sunrise" size={18} color={C.faint} stroke={1.6} />
                  : done ? <View style={[st.dot, { backgroundColor: C.gold }]}><Icon name="check" size={14} color={C.ink} stroke={2.6} /></View>
                  : isNext ? <View style={[st.dot, { borderWidth: 2, borderColor: C.gold }]}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold }} /></View>
                  : <View style={[st.dot, { borderWidth: 1.5, borderColor: passed ? 'rgba(232,168,124,0.5)' : 'rgba(255,255,255,0.18)' }]} />}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T style={{ fontSize: 15, fontFamily: F.medium, color: isNext ? C.goldBright : r.info ? C.dim : C.text }}>{r.fr}</T>
                <T style={{ fontSize: 12, color: C.dim }}>{sub}</T>
              </View>
              <Ar style={{ fontSize: 17, color: C.dim }}>{r.ar}</Ar>
              <T style={{ width: 52, textAlign: 'right', fontSize: 17, fontFamily: F.light, fontVariant: ['tabular-nums'] }}>{r.time}</T>
            </Pressable>
          );
        })}
      </Rise>

      <Pressable onPress={() => router.push('/parametres')} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4 }} accessibilityRole="button">
        <T style={{ fontSize: 12, color: C.dim, flex: 1 }}>{(day?.methodLabel ?? CALC.label).split('·')[0].trim()} · {day?.city ?? ''}</T>
        <T style={{ fontSize: 12, color: C.gold }}>Modifier</T>
      </Pressable>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { minHeight: 62, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  rowNext: { backgroundColor: 'rgba(226,192,141,0.09)', borderColor: 'rgba(226,192,141,0.35)' },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
