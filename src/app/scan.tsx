import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View , Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { T, Label } from '../components/Text';
import { Icon, IconName } from '../components/Icon';
import { GhostButton, IconButton, ND, PrimaryButton, Rise, goBack, useBreath, useLoop } from '../components/ui';
import { Validated } from '../components/Validated';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { PRAYERS, PrayerKey, currentPrayer, getCoords, loadTodayTimes } from '../lib/prayer';
import { getDayLogs, getFajr, getUserId, logPrayer, qrPayload, streakDays } from '../lib/store';
import { playDing, playWoosh } from '../lib/sounds';
import { cancelTodayBlock, unlock } from '../lib/blocker';
import { stopAlarm } from '../lib/alarm';
import { Tip } from '../components/Guide';

type Step = 'scan' | 'saving' | 'done' | 'wrong';
type Result = { time: string; place: string; photo?: string; done: number; before: number; after: number };

export default function Scan() {
  const params = useLocalSearchParams<{ prayer?: PrayerKey; from?: 'block' | 'fajr' }>();
  const [perm, requestPerm] = useCameraPermissions();
  const [step, setStep] = useState<Step>('scan');
  const [prayer, setPrayer] = useState<PrayerKey>(params.prayer || 'Dhuhr');
  const [userId, setUserId] = useState('');
  const [torch, setTorch] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const cam = useRef<CameraView>(null);
  const busy = useRef(false);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getUserId().then(setUserId);
    if (!params.prayer) loadTodayTimes().then((d) => setPrayer(currentPrayer(d.times)?.key ?? 'Fajr'));
  }, [params.prayer]);

  const p = PRAYERS.find((x) => x.key === prayer)!;
  const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  async function validate(method: 'qr' | 'demo') {
    busy.current = true;
    setStep('saving');
    playDing();
    haptic.success();
    let uri: string | undefined;
    try {
      // Photo de preuve prise au moment du scan.
      const pic = await cam.current?.takePictureAsync({ quality: 0.4, skipProcessing: true });
      uri = pic?.uri;
    } catch {}
    const before = await streakDays();
    const g = await getCoords();
    await logPrayer({ prayer, at: new Date().toISOString(), photoUri: uri, lat: g.fromGps ? g.lat : undefined, lng: g.fromGps ? g.lng : undefined, method });
    cancelTodayBlock(prayer); // prière faite avant l'heure du blocage : pas de blocage
    const after = await streakDays();
    const done = (await getDayLogs()).length;
    const d = await loadTodayTimes().catch(() => null);

    if (params.from === 'fajr' && (await getFajr()).squats) {
      // On revient sur l'écran du réveil déjà ouvert (au lieu d'en empiler un second qui ferait encore clignoter la lampe).
      router.dismissTo({ pathname: '/fajr-ring', params: { step: 'squats' } });
      return;
    }
    stopAlarm();
    unlock(prayer);
    setTimeout(playWoosh, 500);
    setRes({ time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), place: d?.city ?? '', photo: uri, done, before, after });
    setStep('done');
  }

  function wrong() {
    setStep('wrong');
    haptic.error();
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 500, easing: Easing.linear, useNativeDriver: ND }).start();
    setTimeout(() => setStep('scan'), 2200);
  }

  function onCode({ data }: { data: string }) {
    if (busy.current || !userId || step !== 'scan') return;
    if (data === qrPayload(userId)) validate('qr');
    else wrong();
  }

  if (step === 'done' && res) {
    return <Validated title="Prière validée" time={`${p.fr} · ${res.time}`} place={res.place} photo={res.photo} doneToday={res.done}
      streakBefore={res.before} streakAfter={res.after} unlocked={params.from !== undefined} onClose={() => router.replace('/')} />;
  }

  const canDemo = Platform.OS === 'web' || __DEV__;
  const native = Platform.OS !== 'web';
  return (
    <View style={{ flex: 1, backgroundColor: '#05060B' }}>
      {native && perm?.granted ? (
        <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={step === 'scan' ? onCode : undefined} />
      ) : (
        <LinearGradient colors={['#2A0E14', '#14070B', '#05060B']} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient pointerEvents="none" colors={['rgba(5,6,11,0.85)', 'rgba(5,6,11,0)', 'rgba(5,6,11,0)', 'rgba(5,6,11,0.9)']} locations={[0, 0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20 }}>
        <Rise style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <IconButton icon="back" label="Retour" onPress={goBack} style={st.glassBtn} />
          <View style={st.pill}><Blink /><T style={{ fontSize: 12 }}>{p.fr} · {nowStr}</T></View>
          {native ? <IconButton icon="torch" label="Lampe" onPress={() => setTorch(!torch)} style={[st.glassBtn, torch && { backgroundColor: 'rgba(226,192,141,0.3)' }]} /> : <View style={{ width: 44 }} />}
        </Rise>

        <Rise delay={150} style={{ alignItems: 'center', marginTop: 22 }}>
          <Text style={{ fontFamily: F.serif, fontSize: 36, color: C.text }}>Montre ton tapis</Text>
          <T style={{ fontSize: 14, color: C.soft, marginTop: 4 }}>Vise le QR collé sur ton tapis de prière</T>
        </Rise>

        <Animated.View style={{ alignSelf: 'center', marginTop: 34, width: 270, height: 270,
          transform: [{ translateX: shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -10, 9, -6, 4, 0] }) }] }}>
          {!(native && perm?.granted) && (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, zIndex: 2 }]}>
              <T style={{ color: C.soft, textAlign: 'center', fontSize: 13 }}>{native ? 'Noor Salat a besoin de la caméra pour lire le QR de ton tapis.' : "La caméra n'est utilisée que dans l'appli mobile."}</T>
              {native && <GhostButton title={perm && !perm.canAskAgain ? 'Ouvrir les réglages' : 'Autoriser la caméra'}
                onPress={() => (perm && !perm.canAskAgain ? Linking.openSettings() : requestPerm())} />}
              {native && perm && !perm.canAskAgain && <T style={{ color: C.dim, textAlign: 'center', fontSize: 12 }}>Active « Appareil photo » pour Noor Salat, puis reviens ici.</T>}
            </View>
          )}
          <Viewfinder />
          {step === 'wrong' && (
            <View style={st.wrong}>
              <Icon name="x" size={34} color={C.warn} stroke={1.8} />
              <T style={{ fontSize: 15, fontFamily: F.medium }}>Ce n'est pas ton tapis</T>
              <T style={{ fontSize: 12, color: '#E6D2C8', textAlign: 'center' }}>Seul ton QR personnel débloque ton téléphone.</T>
            </View>
          )}
          {step === 'saving' && (
            <View style={[st.wrong, { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: C.gold }]}>
              <T>Photo et position…</T>
            </View>
          )}
        </Animated.View>

        <View style={{ flex: 1 }} />
        <Rise delay={350} style={st.sheet}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: -6, marginBottom: 14 }} />
          <View style={{ marginBottom: 12 }}><Tip id="scan" title="Valider ta prière">Après avoir prié, vise le QR collé sur ton tapis : la prière est validée et tes applis reviennent. Ton QR se trouve dans Profil.</Tip></View>
          <Label>Preuve enregistrée</Label>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {([['camera', 'Photo'], ['clock', 'Heure'], ['pin', 'Position']] as [IconName, string][]).map(([ic, l]) => (
              <View key={l} style={st.chip}><Icon name={ic} size={18} color={C.gold} /><T style={{ fontSize: 12, color: C.soft }}>{l}</T></View>
            ))}
          </View>
          <T style={{ fontSize: 12, lineHeight: 18, color: C.faint, marginTop: 14 }}>Tout reste sur ton téléphone. Ton QR personnel se trouve dans ton profil.</T>
          {step === 'scan' && (
            <Pressable onPress={() => router.replace({ pathname: '/versets', params: { prayer } })} accessibilityRole="button" hitSlop={6}
              style={{ marginTop: 14, height: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(226,192,141,0.35)', alignItems: 'center', justifyContent: 'center' }}>
              <T style={{ fontSize: 14, color: C.goldBright }}>Pas de tapis ici ? Lire 5 versets</T>
            </Pressable>
          )}
          {canDemo && step === 'scan' && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <PrimaryButton title="Simuler un scan" gold style={{ flex: 1, height: 46 }} onPress={() => validate('demo')} />
              <Pressable onPress={wrong} style={{ justifyContent: 'center', paddingHorizontal: 8 }}><T style={{ fontSize: 12, color: C.gold }}>Mauvais QR</T></Pressable>
            </View>
          )}
        </Rise>
      </SafeAreaView>
    </View>
  );
}

function Viewfinder() {
  const line = useLoop(2600, 0, Easing.inOut(Easing.sin));
  const b = useBreath(2600);
  const c = (pos: object, r: object) => <View style={[{ position: 'absolute', width: 46, height: 46, borderColor: C.goldBright }, pos, r]} />;
  return (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ scale: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }) }] }]}>
        {c({ top: 0, left: 0 }, { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 22 })}
        {c({ top: 0, right: 0 }, { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 22 })}
        {c({ bottom: 0, left: 0 }, { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 22 })}
        {c({ bottom: 0, right: 0 }, { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 22 })}
      </Animated.View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: '8%', right: '8%', height: 2, borderRadius: 2,
        transform: [{ translateY: line.interpolate({ inputRange: [0, 0.5, 1], outputRange: [16, 244, 16] }) }],
        shadowColor: C.goldBright, shadowOpacity: 0.8, shadowRadius: 12 }}>
        <LinearGradient colors={['rgba(243,217,164,0)', C.goldBright, 'rgba(243,217,164,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </>
  );
}

function Blink() {
  const b = useBreath(1400);
  return <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.goldBright, opacity: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) }} />;
}

const st = StyleSheet.create({
  glassBtn: { backgroundColor: 'rgba(7,9,15,0.55)', borderColor: 'rgba(255,255,255,0.1)' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(7,9,15,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  wrong: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: 'rgba(60,14,22,0.85)', borderWidth: 2, borderColor: C.warn, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  sheet: { marginHorizontal: -8, marginBottom: 6, borderRadius: 30, paddingTop: 20, paddingBottom: 18, paddingHorizontal: 20, backgroundColor: 'rgba(10,12,20,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chip: { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.04)', gap: 8 },
});
