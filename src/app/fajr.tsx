import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PageHeader, Section } from '../components/PageHeader';
import { T, Label } from '../components/Text';
import { Icon } from '../components/Icon';
import { Card, PrimaryButton, Row, Toggle, useBreath } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { FajrSettings, getFajr, setFajr } from '../lib/store';
import { SOURCES, iosSoundFile } from '../lib/alarm';
import { alarmKitAuthorized, alarmKitAvailable, isIOS, requestAlarmKit, testIosAlarm } from '../lib/ios';
import { loadTodayTimes, toDate, scheduleSafe } from '../lib/fajr-helpers';
import { hhmm } from '../lib/prayer';
import { markGuide } from '../components/Guide';

const AUDIOS: { key: FajrSettings['audio']; title: string; note: string }[] = [
  { key: 'khayr', title: 'الصلاة خير من النوم', note: 'As-salātu khayrun mina-n-nawm, en boucle' },
  { key: 'adhan_fajr', title: 'Adhan du Fajr', note: 'Adhan complet, voix de Besim Azemi' },
  { key: 'systeme', title: 'Sonnerie du téléphone', note: 'La sonnerie d’alarme de ton téléphone' },
];

/** Réglages du réveil Fajr. */
export default function Fajr() {
  const [s, setS] = useState<FajrSettings | null>(null);
  const [fajrTime, setFajrTime] = useState('--:--');
  const [playing, setPlaying] = useState<string | null>(null);
  const [akOk, setAkOk] = useState<boolean | null>(null);
  const [akMsg, setAkMsg] = useState('');
  const ak = alarmKitAvailable();
  useEffect(() => { markGuide('fajr'); }, []);
  const player = useRef<AudioPlayer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    getFajr().then(setS);
    if (ak) alarmKitAuthorized().then(setAkOk);
    loadTodayTimes().then((d) => setFajrTime(d.times.Fajr));
    return () => stopPreview();
  }, []));
  useEffect(() => () => stopPreview(), []);

  function update(p: Partial<FajrSettings>) {
    if (!s) return;
    const n = { ...s, ...p };
    setS(n);
    setFajr(n).then(scheduleSafe);
  }
  function stopPreview() {
    if (timer.current) clearTimeout(timer.current);
    try { player.current?.pause(); player.current?.remove(); } catch {}
    player.current = null;
    setPlaying(null);
  }
  function preview(k: FajrSettings['audio']) {
    if (playing === k) return stopPreview();
    stopPreview();
    try { player.current = createAudioPlayer(SOURCES[k]); player.current.volume = 0.6; player.current.play(); } catch {}
    setPlaying(k);
    timer.current = setTimeout(stopPreview, 20000);
  }

  const ring = s && fajrTime !== '--:--' ? toDate(fajrTime) : null;
  if (ring && s) ring.setMinutes(ring.getMinutes() + s.offsetMin);
  const dawn = useBreath(6000);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={['#07090F', '#0D1226', '#1E1830']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -80, right: -80, top: 120, height: 300, opacity: dawn.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] }) }}>
        <Svg width="100%" height="100%">
          <Defs><RadialGradient id="fd" cx="50%" cy="50%" rx="50%" ry="50%"><Stop offset="0" stopColor="#E8A06E" stopOpacity={0.22} /><Stop offset="1" stopColor="#E8A06E" stopOpacity={0} /></RadialGradient></Defs>
          <Rect width="100%" height="100%" fill="url(#fd)" />
        </Svg>
      </Animated.View>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 18 }} showsVerticalScrollIndicator={false}>
          <PageHeader title="Réveil Fajr" subtitle="Lève-toi pour la lumière"
            right={<Toggle value={!!s?.enabled} onChange={(v) => update({ enabled: v })} label="Activer le réveil" />} />

          <View style={{ alignItems: 'center', opacity: s?.enabled ? 1 : 0.4, marginTop: 6 }}>
            <Label>Le réveil sonne à</Label>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8 }}>
              <Pressable style={st.step} onPress={() => { haptic.tap(); s && update({ offsetMin: Math.max(-30, s.offsetMin - 5) }); }} accessibilityRole="button" accessibilityLabel="5 minutes plus tôt"><Icon name="minus" size={20} color={C.text} /></Pressable>
              <Text style={{ fontFamily: F.thin, fontSize: 80, lineHeight: 88, color: C.text, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{ring ? hhmm(ring) : '--:--'}</Text>
              <Pressable style={st.step} onPress={() => { haptic.tap(); s && update({ offsetMin: Math.min(15, s.offsetMin + 5) }); }} accessibilityRole="button" accessibilityLabel="5 minutes plus tard"><Icon name="plus" size={20} color={C.text} /></Pressable>
            </View>
            <T style={{ fontSize: 13, color: C.soft, marginTop: 6 }}>
              {s ? (s.offsetMin === 0 ? "À l'heure du Fajr" : `${Math.abs(s.offsetMin)} min ${s.offsetMin < 0 ? 'avant' : 'après'} le Fajr`) : ''} · Fajr à {fajrTime}
            </T>
          </View>

          <Section>Son du réveil</Section>
          <Card>
            {AUDIOS.map((a, i) => {
              const on = s?.audio === a.key;
              return (
                <View key={a.key} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, i < AUDIOS.length - 1 && st.line]}>
                  <Pressable style={{ flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                    onPress={() => { haptic.tap(); update({ audio: a.key }); }}>
                    <View style={[st.radio, on && { borderColor: C.gold }]}>{on && <View style={st.radioIn} />}</View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T style={{ fontSize: 14 }}>{a.title}</T>
                      <T style={{ fontSize: 11.5, color: C.dim }}>{a.note}</T>
                    </View>
                  </Pressable>
                  {a.key !== 'systeme' && (
                    <Pressable style={st.play} onPress={() => preview(a.key)} accessibilityRole="button" accessibilityLabel={`Écouter ${a.title}`}>
                      {playing === a.key ? <Eq /> : <Icon name="play" size={12} color={C.text} />}
                    </Pressable>
                  )}
                </View>
              );
            })}
          </Card>
          <T style={{ fontSize: 12, lineHeight: 18, color: C.dim, marginTop: -6, marginHorizontal: 4 }}>Le volume monte doucement, avec vibration et flash. Il ne s'arrête qu'après le scan du tapis.{isIOS ? ' Sur iPhone, le réveil joue les 30 premières secondes en boucle (règle d’Apple).' : ''}</T>

          {isIOS && (
            <Card>
              <Row last title="Vrai réveil iPhone" sub={ak ? (akOk ? 'Sonne même en silencieux et en Concentration' : 'Autorise les alarmes pour que le Fajr sonne vraiment') : 'Nécessite iOS 26 : sinon une notification (silencieuse si le téléphone est en silencieux)'}
                onPress={ak && !akOk ? async () => { const ok = await requestAlarmKit(); setAkOk(ok); if (ok) scheduleSafe(); } : undefined}
                right={ak ? <T style={{ fontSize: 13, color: akOk ? C.dim : C.goldBright }}>{akOk ? 'Autorisé' : 'Autoriser'}</T> : undefined} />
            </Card>
          )}
          {isIOS && ak && (
            <T onPress={async () => { const ok = s ? await testIosAlarm(iosSoundFile(s.audio)) : false; setAkMsg(ok ? 'Le réveil va sonner dans 1 minute. Verrouille ton téléphone pour voir.' : 'Autorise les alarmes pour Noor Salat (Réglages › Noor Salat).'); }}
              style={{ fontSize: 13, color: C.gold, textAlign: 'center' }}>{akMsg || 'Tester le vrai réveil (dans 1 minute)'}</T>
          )}

          <Card>
            <Row last title="10 squats pour arrêter" sub="En plus du scan, pour bien se réveiller" right={<Toggle value={!!s?.squats} onChange={(v) => update({ squats: v })} label="10 squats pour arrêter" />} />
          </Card>

          <PrimaryButton title="Tester le réveil" onPress={() => router.push({ pathname: '/fajr-ring', params: { test: '1' } })} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Eq() {
  return <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 }}>{[14, 10, 14].map((h, i) => <EqBar key={i} h={h} d={i * 150} />)}</View>;
}
function EqBar({ h, d }: { h: number; d: number }) {
  const b = useBreath(900, d);
  return <Animated.View style={{ width: 3, height: h, borderRadius: 2, backgroundColor: C.goldBright, transform: [{ scaleY: b.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }} />;
}

const st = StyleSheet.create({
  step: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  line: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  radioIn: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold },
  play: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});
