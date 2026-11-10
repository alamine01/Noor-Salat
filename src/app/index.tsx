import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../components/Screen';
import { Ar, Label, Serif, T } from '../components/Text';
import { Icon, IconName } from '../components/Icon';
import { Halo, IconButton, ND, Ring, Rise } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { dateCourte, hms } from '../lib/format';
import { DayTimes, PRAYERS, PrayerKey, loadTodayTimes, nextPrayer, previousPrayerTime, toDate } from '../lib/prayer';
import { getBlockEnabled, getDayLogs, noorPercent, streakDays } from '../lib/store';
import { canReallyBlock, missingPermissions, scheduleIfStale } from '../lib/blocker';
import { isIOS, screenTimeStatus, selectionCount } from '../lib/ios';
import { canCheckFilter, checkFilter } from '../lib/taqwa';
import { settleEngagement } from '../lib/engagement';
import { syncProfile } from '../lib/firebase';
import { currentDay, currentPeriod, getDispense, getGender, setGender } from '../lib/dispense';
import { FirstSteps } from '../components/Guide';

const TOOLS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Prières', href: '/prieres', icon: 'clock' },
  { label: 'Coran', href: '/coran', icon: 'book' },
  { label: 'Tahajjud', href: '/tahajjud', icon: 'tahajjud' },
  { label: 'Sunna', href: '/sunna', icon: 'sunna' },
  { label: 'Taqwa', href: '/taqwa', icon: 'shieldCheck' },
  { label: 'Qibla', href: '/profile?tab=1', icon: 'compass' },
];

export default function Home() {
  const [day, setDay] = useState<DayTimes | null>(null);
  const [done, setDone] = useState<PrayerKey[]>([]);
  const [noor, setNoor] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missing, setMissing] = useState(0);
  const [now, setNow] = useState(new Date());
  const [femme, setFemme] = useState(false);
  const [askGender, setAskGender] = useState(false);
  const [dispDay, setDispDay] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const d = await loadTodayTimes();
    setDay(d);
    setDone((await getDayLogs()).map((l) => l.prayer));
    setNoor(await noorPercent());
    setStreak(await streakDays());
    const g = await getGender();
    setFemme(g === 'femme');
    setAskGender(g === null);
    const cp = g === 'femme' ? currentPeriod(await getDispense()) : null;
    setDispDay(cp ? currentDay(cp) : null);
    const blockOn = await getBlockEnabled();
    if (canReallyBlock) setMissing(blockOn ? missingPermissions() : 0);
    else if (isIOS && blockOn && screenTimeStatus() !== 'unavailable') setMissing((screenTimeStatus() === 'approved' ? 0 : 1) + (selectionCount() ? 0 : 1));
    scheduleIfStale(d.times).catch(() => {});
    if (canCheckFilter) checkFilter().catch(() => {});
    settleEngagement().catch(() => {});
    syncProfile({ throttle: true }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = day ? nextPrayer(day.times, now) : null;
  const prev = day ? previousPrayerTime(day.times, now) : null;
  const progress = next && prev ? (now.getTime() - prev.getTime()) / (next.at.getTime() - prev.getTime()) : 0;
  const left = next ? (next.at.getTime() - now.getTime()) / 1000 : 0;
  const place = !day ? 'Chargement…' : day.source === 'exemple' ? 'Exemple hors-ligne' : `${day.city} · horaires locaux`;

  return (
    <Screen stars gap={0}>
      <Rise style={st.header}>
        <View style={{ flex: 1, gap: 6 }}>
          <T style={{ fontSize: 12, color: C.dim }}>{dateCourte(now)}{day?.hijri ? ` · ${day.hijri}` : ''}</T>
          <Serif style={{ fontSize: 32, lineHeight: 36 }}>Assalamu alaykum</Serif>
          <Pressable onPress={() => router.push('/lieu')} accessibilityRole="button" accessibilityLabel="Changer de lieu" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="pin" size={14} color={C.gold} stroke={1.8} />
            <T style={{ fontSize: 12, color: C.dim }}>{place}{day?.source === 'cache' ? ' · hors-ligne' : ''}</T>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon="settings" label="Réglages" onPress={() => router.push('/parametres')} />
          <Pressable accessibilityRole="button" accessibilityLabel="Mon profil" onPress={() => { haptic.tap(); router.push('/profile'); }} style={st.avatar}>
            <Text style={{ fontFamily: F.arabic, fontSize: 22, lineHeight: 34, color: C.goldBright }}>ن</Text>
          </Pressable>
        </View>
      </Rise>

      <Pressable onPress={() => router.push('/prieres')} accessibilityRole="button" accessibilityLabel={next ? `Prochaine prière ${next.fr} dans ${hms(left)}` : 'Prières'}
        style={{ alignSelf: 'center', width: 270, height: 270, marginTop: 26, alignItems: 'center', justifyContent: 'center' }}>
        <Halo size={210} />
        <Ring size={270} value={progress} duration={1800}>
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Label style={{ fontSize: 10 }}>Prochaine prière</Label>
            <Serif style={{ fontSize: 72, lineHeight: 80, marginTop: 4 }}>{next?.fr ?? '…'}</Serif>
            <Ar style={{ fontSize: 22, lineHeight: 32 }}>{next?.ar ?? ''}</Ar>
            <T style={{ fontSize: 15, color: C.dim, marginTop: 6, fontFamily: F.light }}>
              dans <Text style={{ color: C.text, fontFamily: F.medium, fontVariant: ['tabular-nums'] }}>{hms(left)}</Text>
            </T>
          </View>
        </Ring>
        {next && (
          <Rise delay={1900} style={{ position: 'absolute', left: 135 + 130 * Math.cos(2 * Math.PI * progress - Math.PI / 2) - 11, top: 135 + 130 * Math.sin(2 * Math.PI * progress - Math.PI / 2) - 11, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(243,217,164,0.25)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.goldBright }} />
          </Rise>
        )}
      </Pressable>

      <Rise delay={500} style={{ marginTop: 30 }}>
        <View style={st.lineWrap}>
          <View style={st.line} />
          <View style={[st.line, { position: 'absolute', left: 0, backgroundColor: C.gold, width: `${(Math.max(0, PRAYERS.findIndex((p) => p.key === next?.key)) / 4) * 100}%` }]} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {PRAYERS.map((p) => {
            const isDone = done.includes(p.key);
            const isNext = next?.key === p.key && !isDone;
            const passed = day ? toDate(day.times[p.key], now) <= now : false;
            return (
              <Pressable key={p.key} style={{ flex: 1, alignItems: 'center', gap: 8 }} accessibilityRole="button"
                accessibilityLabel={`${p.fr} ${day?.times[p.key] ?? ''} ${isDone ? 'validée' : ''}`}
                onPress={() => router.push({ pathname: '/scan', params: { prayer: p.key } })}>
                <Dot kind={isDone ? 'done' : isNext ? 'next' : passed ? 'missed' : 'later'} />
                <T style={{ fontSize: 12, fontFamily: F.medium, color: isNext ? C.gold : isDone ? C.text : C.dim }}>{p.fr}</T>
                <T style={{ fontSize: 12, color: C.dim, marginTop: -4, fontVariant: ['tabular-nums'] }}>{day?.times[p.key] ?? '--:--'}</T>
              </Pressable>
            );
          })}
        </View>
      </Rise>

      <Rise delay={700} style={{ marginTop: 26 }}>
        <Pressable onPress={() => router.push('/progres')} accessibilityRole="button" style={st.stats}>
          <View style={[st.stat, { borderRightWidth: 1, borderRightColor: C.line }]}>
            <Icon name="flame" size={18} color={C.gold} stroke={1.8} />
            <T style={st.statNum}>{streak}</T><T style={st.statTxt}>{streak > 1 ? 'jours de série' : 'jour de série'}</T>
          </View>
          <View style={st.stat}>
            <Icon name="sun" size={18} color={C.gold} stroke={1.8} />
            <T style={st.statNum}>{noor}%</T><T style={st.statTxt}>Noor</T>
          </View>
        </Pressable>
      </Rise>

      <Rise delay={850} style={{ flexDirection: 'row', marginTop: 20, marginHorizontal: -6 }}>
        {(femme ? [...TOOLS.slice(0, 5), { label: 'Dispense', href: '/dispense', icon: 'moon' as IconName }, TOOLS[5]] : TOOLS).map((t) => (
          <Pressable key={t.label} onPress={() => { haptic.tap(); router.push(t.href as never); }} accessibilityRole="button" accessibilityLabel={t.label}
            style={({ pressed }) => [{ flex: 1, alignItems: 'center', gap: 7, opacity: pressed ? 0.7 : 1 }]}>
            <View style={st.tool}><Icon name={t.icon} size={21} color={C.gold} stroke={1.6} /></View>
            <T style={{ fontSize: 11, color: C.soft }}>{t.label}</T>
          </Pressable>
        ))}
      </Rise>

      {askGender && (
        <Rise delay={880} style={[st.warn, { marginTop: 22, flexWrap: 'wrap' }]}>
          <T style={{ flex: 1, minWidth: 160, fontSize: 13, color: C.soft }}>Pour adapter l’appli, tu es…</T>
          {([['homme', 'Un frère'], ['femme', 'Une sœur']] as const).map(([k, label]) => (
            <Pressable key={k} onPress={async () => { haptic.tap(); await setGender(k); refresh(); }} accessibilityRole="button"
              style={{ height: 40, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(226,192,141,0.4)', justifyContent: 'center' }}>
              <T style={{ fontSize: 13, color: C.goldBright }}>{label}</T>
            </Pressable>
          ))}
        </Rise>
      )}

      <Rise delay={900} style={{ marginTop: 22 }}><FirstSteps /></Rise>

      {dispDay !== null && (
        <Rise delay={950} style={{ marginTop: 22 }}>
          <Pressable onPress={() => router.push('/dispense')} style={st.warn} accessibilityRole="button">
            <Icon name="moon" size={16} color={C.gold} />
            <T style={{ flex: 1, fontSize: 13, color: C.soft }}>Pause en cours · jour {dispDay}. Blocages et réveil suspendus.</T>
            <Icon name="chevron" size={16} color={C.faint} />
          </Pressable>
        </Rise>
      )}

      {missing > 0 && dispDay === null && (
        <Rise delay={1000} style={{ marginTop: 22 }}>
          <Pressable onPress={() => router.push('/parametres')} style={st.warn} accessibilityRole="button">
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.warn }} />
            <T style={{ flex: 1, fontSize: 13, color: C.soft }}>Le blocage n'est pas prêt · {isIOS ? 'choisis tes applis dans Réglages' : `${missing} autorisation${missing > 1 ? 's' : ''} à donner`}</T>
            <Icon name="chevron" size={16} color={C.faint} />
          </Pressable>
        </Rise>
      )}
    </Screen>
  );
}

function Dot({ kind }: { kind: 'done' | 'next' | 'later' | 'missed' }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (kind !== 'next') return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: ND }));
    loop.start();
    return () => loop.stop();
  }, [kind, pulse]);
  if (kind === 'done') return <View style={[st.dot, { backgroundColor: C.gold }]}><Icon name="check" size={14} color={C.ink} stroke={2.6} /></View>;
  if (kind === 'next') return (
    <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[st.dot, { position: 'absolute', borderWidth: 2, borderColor: C.gold, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] }]} />
      <View style={[st.dot, { borderWidth: 2, borderColor: C.gold, backgroundColor: C.bg }]}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold }} /></View>
    </View>
  );
  return <View style={[st.dot, { borderWidth: 1.5, borderColor: kind === 'missed' ? 'rgba(232,168,124,0.5)' : 'rgba(255,255,255,0.18)', backgroundColor: C.bg }]} />;
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E1A12', borderWidth: 1, borderColor: 'rgba(226,192,141,0.4)', alignItems: 'center', justifyContent: 'center' },
  lineWrap: { position: 'absolute', top: 12, left: '10%', right: '10%' },
  line: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stats: { height: 58, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statNum: { fontSize: 22, fontFamily: F.light, fontVariant: ['tabular-nums'] },
  statTxt: { fontSize: 12, color: C.dim },
  tool: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(232,168,124,0.3)', backgroundColor: 'rgba(232,168,124,0.06)' },
});
