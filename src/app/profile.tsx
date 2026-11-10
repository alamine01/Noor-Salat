import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Magnetometer } from 'expo-sensors';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Screen } from '../components/Screen';
import { T } from '../components/Text';
import { Icon } from '../components/Icon';
import { GhostButton, Halo, IconButton, ND, PrimaryButton, Rise, Segmented, goBack, useLoop } from '../components/ui';
import { C, F } from '../lib/theme';
import { getUserId, noorPercent, qrPayload, streakDays } from '../lib/store';
import { Rank, firebaseConfigured, loadLeaderboard } from '../lib/firebase';
import { getPrayerPlace, qiblaBearing } from '../lib/prayer';

export default function Profile() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState(Number(params.tab) || 0);
  const [id, setId] = useState('');
  useEffect(() => { getUserId().then(setId); }, []);
  useEffect(() => { if (params.tab) setTab(Math.min(1, Number(params.tab) || 0)); }, [params.tab]);

  return (
    <Screen nav={false}>
      <Rise style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 }}>
        <IconButton icon="back" label="Retour" onPress={goBack} />
        <View style={st.avatar}><Text style={{ fontFamily: F.arabic, fontSize: 26, lineHeight: 40, color: C.goldBright }}>ن</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.serif, fontSize: 28, lineHeight: 32, color: C.text }}>Mon espace</Text>
          <Pressable onPress={() => router.push('/compte')} accessibilityRole="button">
            <T style={{ fontSize: 12, color: C.dim }}>{id} · <T style={{ fontSize: 12, color: C.gold }}>{firebaseConfigured ? 'mon compte' : 'sur ce téléphone'}</T></T>
          </Pressable>
        </View>
        <IconButton icon="settings" label="Réglages" onPress={() => router.push('/parametres')} />
      </Rise>
      <Segmented items={['Mon QR', 'Qibla']} value={tab} onChange={setTab} />
      {tab === 0 && <QrTab id={id} />}
      {tab === 1 && <QiblaTab />}
      {/* Compagnons : mis de côté pour une prochaine version (FriendsTab plus bas). */}
    </Screen>
  );
}

function QrTab({ id }: { id: string }) {
  const [big, setBig] = useState(false);
  const line = useLoop(3000, 0, Easing.inOut(Easing.sin));
  return (
    <Rise style={{ alignItems: 'center', gap: 18 }}>
      <View style={st.qrCard}>
        {id ? <QRCode value={qrPayload(id)} size={206} color="#15120C" backgroundColor="#F6EEDC" ecl="H" /> : <View style={{ width: 206, height: 206 }} />}
        <View style={st.qrMark}><Text style={{ fontFamily: F.arabic, fontSize: 26, lineHeight: 40, color: '#8A6A3A' }}>ن</Text></View>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 22, right: 22, top: 22, height: 2, backgroundColor: 'rgba(201,162,106,0.7)',
          transform: [{ translateY: line.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 204, 0] }) }] }} />
      </View>
      <T style={{ textAlign: 'center', fontSize: 13, lineHeight: 20, color: C.soft, paddingHorizontal: 8 }}>Imprime-le et colle-le sur ton tapis. Il est unique : seul ce QR débloque ton téléphone.</T>
      <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
        <GhostButton title="Plein écran" onPress={() => setBig(true)} style={{ flex: 1 }} />
        <PrimaryButton title="Imprimer" onPress={() => setBig(true)} style={{ flex: 1, height: 50, borderRadius: 16 }} />
      </View>
      <T style={{ fontSize: 11, color: C.faint }}>Bientôt : un autocollant NFC à la place du QR</T>
      <Modal visible={big} animationType="fade" transparent onRequestClose={() => setBig(false)}>
        <Pressable onPress={() => setBig(false)} style={{ flex: 1, backgroundColor: '#F6EEDC', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 30 }}>
          {id ? <QRCode value={qrPayload(id)} size={280} color="#15120C" backgroundColor="#F6EEDC" ecl="H" /> : null}
          <Text style={{ fontFamily: F.medium, fontSize: 14, color: '#3A3326', textAlign: 'center', lineHeight: 21 }}>
            Fais une capture d'écran et imprime-la (environ 8 cm de côté), ou scanne-la depuis un autre téléphone pour tester.{'\n\n'}Touche l'écran pour fermer.
          </Text>
        </Pressable>
      </Modal>
    </Rise>
  );
}

function QiblaTab() {
  const [qibla, setQibla] = useState<number | null>(null);
  const [city, setCity] = useState('');
  const [heading, setHeading] = useState<number | null>(null);
  const settle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    getPrayerPlace().then((g) => { setQibla(qiblaBearing(g.lat, g.lng)); setCity(g.city); });
    Animated.timing(settle, { toValue: 1, duration: 2600, easing: Easing.out(Easing.elastic(1.2)), useNativeDriver: ND }).start();
    if (Platform.OS === 'web') return;
    Magnetometer.setUpdateInterval(150);
    const sub = Magnetometer.addListener(({ x, y }) => setHeading(((Math.atan2(y, x) * 180) / Math.PI + 360 + 270) % 360));
    return () => sub.remove();
  }, [settle]);
  const q = qibla ?? 0;
  // Le cadran tourne avec le téléphone ; sans capteur, il reste orienté nord en haut.
  const dial = heading == null ? 0 : -heading;
  const aligned = heading != null && Math.abs((((q - heading) % 360) + 540) % 360 - 180) < 5;
  return (
    <Rise style={{ alignItems: 'center' }}>
      <View style={{ width: 290, height: 290, alignItems: 'center', justifyContent: 'center' }}>
        <Halo size={210} opacity={aligned ? 0.5 : 0.25} />
        <Animated.View style={{ transform: [{ rotate: settle.interpolate({ inputRange: [0, 1], outputRange: [`${dial - 40}deg`, `${dial}deg`] }) }] }}>
          <Svg width={290} height={290} viewBox="0 0 290 290">
            <Defs><LinearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.goldBright} /><Stop offset="1" stopColor="#8A6A3A" /></LinearGradient></Defs>
            <Circle cx={145} cy={145} r={138} fill="none" stroke="rgba(255,255,255,0.1)" />
            <Circle cx={145} cy={145} r={112} fill="none" stroke="rgba(255,255,255,0.06)" />
            {Array.from({ length: 72 }).map((_, i) => (
              <Line key={i} x1={145} y1={9} x2={145} y2={i % 18 === 0 ? 21 : 14} stroke={i % 18 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth={1.2} transform={`rotate(${i * 5} 145 145)`} />
            ))}
            <SvgText x={145} y={40} fill={C.text} fontSize={13} fontWeight="600" textAnchor="middle">N</SvgText>
            <SvgText x={252} y={150} fill={C.faint} fontSize={12} textAnchor="middle">E</SvgText>
            <SvgText x={145} y={260} fill={C.faint} fontSize={12} textAnchor="middle">S</SvgText>
            <SvgText x={38} y={150} fill={C.faint} fontSize={12} textAnchor="middle">O</SvgText>
            <G transform={`rotate(${q} 145 145)`}>
              <Path d="M145 30 L154 145 L145 156 L136 145 Z" fill="url(#ng)" />
              <Rect x={135} y={14} width={20} height={20} rx={3} fill="#15120C" stroke={C.goldBright} strokeWidth={1.5} />
              <Line x1={135} y1={21} x2={155} y2={21} stroke={C.goldBright} strokeWidth={1.5} />
            </G>
            <Circle cx={145} cy={145} r={6} fill={C.bg} stroke={C.goldBright} strokeWidth={2} />
          </Svg>
        </Animated.View>
      </View>
      <Text style={{ fontFamily: F.thin, fontSize: 44, color: C.text, marginTop: 10, fontVariant: ['tabular-nums'] }}>{qibla == null ? '…' : `${Math.round(q)}°`}</Text>
      <T style={{ fontSize: 13, color: aligned ? C.goldBright : C.dim, textAlign: 'center' }}>{aligned ? 'Tu es face à la Qibla' : `depuis le nord · direction de la Kaaba depuis ${city || 'ta position'}`}</T>
      <T style={{ fontSize: 12, color: C.faint, textAlign: 'center', marginTop: 14 }}>
        {Platform.OS === 'web' ? 'La boussole bouge dans l’appli mobile.' : 'Tiens le téléphone à plat, loin des objets métalliques.'}
      </T>
    </Rise>
  );
}

function FriendsTab() {
  const [rows, setRows] = useState<Rank[]>([]);
  const [demo, setDemo] = useState(true);
  useFocusEffect(useCallback(() => {
    (async () => {
      const r = await loadLeaderboard(await noorPercent(), await streakDays()).catch(() => ({ rows: [], demo: true }));
      setRows(r.rows); setDemo(r.demo);
    })();
  }, []));
  return (
    <Rise style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T style={{ fontSize: 12, color: C.dim }}>Classement de la semaine</T>
        {demo && <T style={{ fontSize: 12, color: C.faint }}>exemple</T>}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[st.friend, r.me && { backgroundColor: 'rgba(226,192,141,0.08)', borderColor: 'rgba(226,192,141,0.25)' }]}>
          <View style={st.initial}><T style={{ fontSize: 14, fontFamily: F.semibold, color: C.goldBright }}>{r.me ? 'T' : r.name.slice(0, 1)}</T></View>
          <T style={{ flex: 1, fontSize: 14 }}>{r.me ? 'Toi' : r.name}</T>
          <T style={{ fontSize: 12, color: C.dim }}>{r.streak} j</T>
          <T style={{ width: 44, textAlign: 'right', fontSize: 14, fontFamily: F.light, fontVariant: ['tabular-nums'] }}>{r.noor}%</T>
        </View>
      ))}
      <GhostButton title="Apparaître dans le classement" icon="plus" onPress={() => router.push('/compte')} />
      <T style={{ fontSize: 12, lineHeight: 18, color: C.faint, paddingHorizontal: 4 }}>
        {demo ? "Les noms ci-dessus sont des exemples : le classement réel s'affiche dès que des utilisateurs choisissent d'y apparaître." : 'Seuls le pseudo, le % Noor et la série sont visibles.'}
      </T>
    </Rise>
  );
}

const st = StyleSheet.create({
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1E1A12', borderWidth: 1, borderColor: 'rgba(226,192,141,0.45)', alignItems: 'center', justifyContent: 'center' },
  qrCard: { width: 250, height: 250, borderRadius: 28, backgroundColor: '#F6EEDC', padding: 22, alignItems: 'center', justifyContent: 'center', shadowColor: C.gold, shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 20 } },
  qrMark: { position: 'absolute', width: 44, height: 44, borderRadius: 12, backgroundColor: '#F6EEDC', alignItems: 'center', justifyContent: 'center' },
  friend: { height: 62, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  initial: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(226,192,141,0.14)', alignItems: 'center', justifyContent: 'center' },
});
