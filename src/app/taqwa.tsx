import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, AppState, Linking, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../components/Screen';
import { PageHeader, Section } from '../components/PageHeader';
import { Label, T, Text, TextInput } from '../components/Text';
import { Icon } from '../components/Icon';
import { Card, Chip, GhostButton, PrimaryButton, Ring, Ripples, Rise, Row, Toggle, useBreath } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { NoorBlocker } from '../../modules/noor-blocker';
import { ANDROID_FILTER, FILTER_DNS, FilterState, canCheckFilter, checkFilter } from '../lib/taqwa';
import { getTaqwa, setTaqwa } from '../lib/store';
import { iosFilterActive, iosSetFilter, isIOS, screenTimeAvailable } from '../lib/ios';
import { CANCEL_DELAY_H, Engagement, GOALS, MAX_DAYS, engagementInfo, getEngagement, getHistory, keepEngagement, settleEngagement, startEngagement } from '../lib/engagement';
import { dateCourte } from '../lib/format';
import { Tip } from '../components/Guide';

export default function Taqwa() {
  if (Platform.OS === 'android' && !ANDROID_FILTER) return <TaqwaSoon />;
  return <TaqwaFilter />;
}

/** Android : le Noor Filter n'est pas encore proposé. */
function TaqwaSoon() {
  return (
    <Screen nav={false}>
      <PageHeader title="Taqwa" subtitle="Protège ton regard" />
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <View style={st.shield}><Icon name="shieldCheck" size={46} color={C.faint} stroke={1.5} /></View>
        <Text style={{ fontFamily: F.serif, fontSize: 28, color: C.text, marginTop: 14 }}>Noor Filter</Text>
        <T style={{ fontSize: 13, color: C.gold, marginTop: 6 }}>Disponible sur iPhone pour l'instant</T>
      </View>
      <Card style={{ paddingVertical: 18, gap: 10 }}>
        <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>Sur iPhone, Noor Filter bloque les sites pour adultes en un geste, sur tout le téléphone.</T>
        <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>La version Android arrive bientôt, in shaa Allah.</T>
      </Card>
    </Screen>
  );
}

function TaqwaFilter() {
  const [state, setState] = useState<FilterState>('unknown');
  const [host, setHost] = useState<string | null>(null);
  const [days, setDays] = useState(0);
  const [alert, setAlert] = useState(true);
  const [checking, setChecking] = useState(false);
  const [eng, setEng] = useState<Engagement | null>(null);
  const [kept, setKept] = useState(0);

  const loadEng = useCallback(async () => {
    if (!isIOS) return;
    const r = await settleEngagement();
    if (r === 'tenu') { haptic.success(); Alert.alert('Engagement tenu', 'MashaAllah ! Tu as tenu jusqu’au bout. Ton filtre reste actif.'); }
    if (r === 'annule') Alert.alert('Engagement annulé', 'Le filtre est coupé. Tu peux reprendre un engagement quand tu veux.');
    if (r === 'rompu') Alert.alert('Engagement interrompu', 'Le filtre n’est plus actif : l’accès Temps d’écran a sans doute été retiré. Tu peux recommencer quand tu veux.');
    setEng(await getEngagement());
    setKept((await getHistory()).filter((h) => h.result === 'tenu').length);
  }, []);

  const verify = useCallback(async (manual = false) => {
    if (isIOS) { setState(iosFilterActive() ? 'on' : screenTimeAvailable() ? 'off' : 'unknown'); return; }
    setChecking(true);
    const r = await checkFilter();
    setState(r.state); setHost(r.host); setDays(r.days);
    setChecking(false);
    if (manual) (r.state === 'on' ? haptic.success : haptic.error)();
  }, []);

  useFocusEffect(useCallback(() => { loadEng().then(() => verify()); getTaqwa().then((t) => setAlert(t.alert)); }, [verify, loadEng]));
  // Au retour des réglages Android, on vérifie de nouveau.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && verify());
    return () => sub.remove();
  }, [verify]);

  const on = state === 'on';
  const openSettings = () => {
    if (NoorBlocker?.openNetworkSettings) NoorBlocker.openNetworkSettings();
    else if (Platform.OS === 'android') Linking.sendIntent('android.settings.WIRELESS_SETTINGS').catch(() => Linking.openSettings());
    else Linking.openSettings();
  };
  const warn = useBreath(1600);
  const label = on ? 'Actif · ton téléphone est protégé'
    : state === 'other' ? `Un autre DNS privé est actif (${host})`
    : state === 'off' ? 'Désactivé · active-le en 1 minute'
    : Platform.OS === 'ios' ? 'Désactivé · active-le en un geste' : 'À activer dans les réglages';

  return (
    <Screen nav={false}>
      <PageHeader title="Taqwa" subtitle="Protège ton regard" />
      <Tip id="taqwa" title="Protéger ton regard">Active le filtre pour bloquer les sites pour adultes sur tout le téléphone. Pour aller plus loin, prends un engagement : il ne pourra plus être coupé depuis l’appli avant la date choisie.</Tip>

      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <View style={{ width: 104, height: 104, alignItems: 'center', justifyContent: 'center' }}>
          {on && <Ripples size={104} count={2} duration={2600} />}
          <View style={[st.shield, on && st.shieldOn]}>
            <Icon name={on ? 'shieldCheck' : 'shieldAlert'} size={46} color={on ? C.goldBright : C.faint} stroke={1.5} />
          </View>
        </View>
        <Text style={{ fontFamily: F.serif, fontSize: 28, color: C.text, marginTop: 14 }}>Noor Filter</Text>
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, opacity: on ? 1 : warn.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: on ? C.goldBright : C.warn }} />
          <T style={{ fontSize: 13, color: on ? C.goldBright : C.warn }}>{label}</T>
        </Animated.View>
      </View>

      {on ? (
        <Rise>
          <Card gold style={{ paddingVertical: 16, gap: 10 }}>
            <View style={st.between}><T style={st.k}>Sites adultes bloqués</T><T style={{ fontSize: 13, color: C.goldBright }}>sur tout le téléphone</T></View>
            <View style={st.between}><T style={st.k}>Vérifié</T><T style={{ fontSize: 13 }}>à l'instant</T></View>
            {!isIOS && <View style={st.between}><T style={st.k}>Jours protégés</T><T style={{ fontSize: 13, fontVariant: ['tabular-nums'] }}>{days}</T></View>}
            {isIOS && !eng && <GhostButton title="Désactiver le filtre" color={C.dim} onPress={async () => { await iosSetFilter(false); verify(); }} />}
          </Card>
        </Rise>
      ) : Platform.OS === 'ios' ? (
        <Rise>
          <Card style={{ paddingVertical: 18, gap: 12 }}>
            <Label>iPhone</Label>
            {screenTimeAvailable() ? (
              <>
                <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>Noor Salat active le filtre « sites pour adultes » d'Apple, sur Safari et dans les applis. Il faut autoriser Temps d'écran une fois.</T>
                <PrimaryButton title="Activer le filtre" icon="shieldCheck" onPress={async () => { const ok = await iosSetFilter(true); (ok ? haptic.success : haptic.error)(); verify(); }} />
              </>
            ) : (
              <>
                <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>Réglages › Temps d'écran › Restrictions de contenu › Contenu web › « Limiter les sites pour adultes ». Ajoute un code que tu confies à quelqu'un de confiance.</T>
                <GhostButton title="Ouvrir les réglages" onPress={openSettings} />
              </>
            )}
          </Card>
        </Rise>
      ) : (
        <Rise>
          <Card style={{ paddingVertical: 18, gap: 12 }}>
            <Label>Android · 3 étapes</Label>
            {['Ouvre Réglages › Connexions (ou Réseau) › DNS privé', "Choisis « Nom d'hôte du fournisseur »", 'Écris cette adresse :'].map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={st.num}><T style={{ fontSize: 12, color: C.goldBright }}>{i + 1}</T></View>
                <T style={{ flex: 1, fontSize: 13, lineHeight: 20, color: C.soft }}>{t}</T>
              </View>
            ))}
            <Text selectable style={st.dns}>{FILTER_DNS}</Text>
            <T style={{ fontSize: 11, color: C.faint, marginTop: -4 }}>Appui long sur l'adresse pour la copier.</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <GhostButton title="Ouvrir les réglages" onPress={openSettings} style={{ flex: 1 }} />
              {canCheckFilter && <PrimaryButton title={checking ? '…' : 'Vérifier'} onPress={() => verify(true)} style={{ flex: 1, height: 50, borderRadius: 16 }} />}
            </View>
            {!canCheckFilter && Platform.OS === 'android' && <T style={{ fontSize: 11, color: C.faint }}>Installe la nouvelle version de l'appli pour la vérification automatique.</T>}
          </Card>
        </Rise>
      )}

      {isIOS && screenTimeAvailable() && <EngagementSection eng={eng} kept={kept} onChange={() => loadEng().then(() => verify())} />}

      <Section>Rester protégé</Section>
      <Card>
        <Row title="Prévenir si le filtre est coupé" sub="Vérifié à chaque ouverture de l'appli"
          right={<Toggle value={alert} label="Prévenir si le filtre est coupé" onChange={async (v) => { setAlert(v); const t = await getTaqwa(); await setTaqwa({ ...t, alert: v }); }} />} />
        <Row last title="Mon garant" sub="Un proche de confiance est prévenu" right={<T style={{ fontSize: 12, color: C.faint }}>Bientôt</T>} />
      </Card>
      <T style={{ fontSize: 11, lineHeight: 17, color: C.faint, textAlign: 'center' }}>Noor Salat n'installe pas de filtre lui-même : il t'aide à activer le filtre gratuit de ton téléphone et vérifie qu'il reste actif.</T>
    </Screen>
  );
}

const st = StyleSheet.create({
  input: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, color: C.text, fontFamily: F.regular, fontSize: 15, paddingHorizontal: 14 },
  shield: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  shieldOn: { backgroundColor: '#251E12', borderColor: 'rgba(243,217,164,0.6)', shadowColor: C.goldBright, shadowOpacity: 0.4, shadowRadius: 30 },
  between: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 12, rowGap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: C.line },
  stepBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  daysInput: { minWidth: 90, textAlign: 'center', color: C.goldBright, fontFamily: F.light, fontSize: 40, paddingVertical: 0, fontVariant: ['tabular-nums'] },
  cancelBox: { gap: 8, padding: 16, borderRadius: 20, backgroundColor: 'rgba(232,168,124,0.08)', borderWidth: 1, borderColor: 'rgba(232,168,124,0.3)' },
  k: { fontSize: 13, color: C.soft },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(226,192,141,0.15)', alignItems: 'center', justifyContent: 'center' },
  dns: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, color: C.goldBright, padding: 14, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center' },
});

/** iPhone : prendre un engagement de N jours (libre, 1 à 365), le suivre, ou l'annuler (une page du Coran + 3 heures). */
function EngagementSection({ eng, kept, onChange }: { eng: Engagement | null; kept: number; onChange: () => void }) {
  const [days, setDays] = useState(30);
  const [typed, setTyped] = useState('30');
  const [intention, setIntention] = useState('');
  const [now, setNow] = useState(Date.now());
  const { width } = useWindowDimensions();
  const narrow = width < 380; // petits iPhone : on empile au lieu d'aligner
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(id); }, []);

  const pick = (n: number) => { const v = Math.max(1, Math.min(MAX_DAYS, Math.round(n) || 1)); setDays(v); setTyped(String(v)); };

  if (eng) {
    const info = engagementInfo(eng, now);
    const left = info.cancelAt ? Math.max(0, info.cancelAt.getTime() - now) : 0;
    const h = Math.floor(left / 3_600_000), m = Math.ceil((left % 3_600_000) / 60_000);
    const until = dateCourte(info.end);
    return (
      <Rise>
        <Card gold style={{ paddingVertical: 20, gap: 16 }}>
          <Label>Mon engagement</Label>
          <View style={{ flexDirection: narrow ? 'column' : 'row', alignItems: 'center', gap: narrow ? 12 : 18 }}>
            <Ring size={narrow ? 120 : 100} stroke={6} value={info.day / eng.days} duration={1200}>
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <T style={{ fontSize: narrow ? 34 : 28, fontFamily: F.light }}>{info.day}</T>
                <T style={{ fontSize: 11, color: C.dim }}>sur {eng.days} j</T>
              </View>
            </Ring>
            <View style={{ flex: narrow ? 0 : 1, gap: 4, alignItems: narrow ? 'center' : 'flex-start', minWidth: 0 }}>
              <T style={{ fontSize: 16, textAlign: narrow ? 'center' : 'left' }}>Jour {info.day} sur {eng.days}</T>
              <T style={{ fontSize: 13, lineHeight: 19, color: C.dim, textAlign: narrow ? 'center' : 'left' }}>
                Filtre verrouillé jusqu’au {until.charAt(0).toLowerCase() + until.slice(1)}
              </T>
              {!!eng.intention && (
                <Text style={{ fontFamily: F.serifItalic, fontSize: 18, lineHeight: 24, color: C.goldBright, marginTop: 4, textAlign: narrow ? 'center' : 'left' }}>« {eng.intention} »</Text>
              )}
            </View>
          </View>

          {info.cancelAt ? (
            <View style={st.cancelBox}>
              <T style={{ fontSize: 12, color: C.warn, textAlign: 'center' }}>Annulation demandée · le filtre se coupera dans</T>
              <T style={{ fontSize: 30, fontFamily: F.light, color: C.text, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                {left > 0 ? `${h} h ${String(m).padStart(2, '0')}` : 'maintenant'}
              </T>
              <PrimaryButton title="Je reste engagé" icon="shieldCheck" gold onPress={async () => { haptic.success(); await keepEngagement(); onChange(); }} />
            </View>
          ) : (
            <T onPress={() => Alert.alert('Annuler l’engagement ?', `Tu vas d’abord lire une page du Coran. Ensuite, le filtre se coupera ${CANCEL_DELAY_H} heures plus tard. Tu pourras changer d’avis pendant ce temps.`, [
              { text: 'Je reste engagé', style: 'cancel' },
              { text: 'Continuer', onPress: () => router.push('/taqwa-page') },
            ])} style={{ fontSize: 13, color: C.faint, textAlign: 'center', paddingVertical: 8 }} accessibilityRole="button">Annuler l’engagement</T>
          )}
        </Card>
      </Rise>
    );
  }

  return (
    <Rise>
      <Card style={{ paddingVertical: 20, gap: 14 }}>
        <Label>Prendre un engagement</Label>
        <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>Pendant la durée choisie, le filtre ne peut plus être coupé depuis l’appli. Pour annuler avant la fin : une page du Coran à lire, puis {CANCEL_DELAY_H} heures d’attente.</T>

        {/* Durée libre : un nombre de jours au choix, ou un raccourci */}
        <View style={st.stepper}>
          <Pressable onPress={() => { haptic.tap(); pick(days - 1); }} onLongPress={() => pick(days - 10)} style={st.stepBtn} accessibilityRole="button" accessibilityLabel="Un jour de moins">
            <Icon name="minus" size={18} color={C.text} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <TextInput value={typed} onChangeText={(v) => setTyped(v.replace(/[^0-9]/g, '').slice(0, 3))} onEndEditing={() => pick(Number(typed))} onBlur={() => pick(Number(typed))}
              keyboardType="number-pad" returnKeyType="done" maxLength={3} selectTextOnFocus
              style={st.daysInput} accessibilityLabel="Nombre de jours" />
            <T style={{ fontSize: 12, color: C.dim, marginTop: -2 }}>{days > 1 ? 'jours' : 'jour'}</T>
          </View>
          <Pressable onPress={() => { haptic.tap(); pick(days + 1); }} onLongPress={() => pick(days + 10)} style={st.stepBtn} accessibilityRole="button" accessibilityLabel="Un jour de plus">
            <Icon name="plus" size={18} color={C.text} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GOALS.map((g) => <Chip key={g} label={`${g} j`} on={days === g} onPress={() => pick(g)} style={{ flexGrow: 1, minWidth: 60 }} />)}
        </View>
        <T style={{ fontSize: 11, color: C.faint, textAlign: 'center', marginTop: -4 }}>De 1 à {MAX_DAYS} jours · appui long sur − ou + pour aller de 10 en 10</T>

        <TextInput value={intention} onChangeText={(v) => setIntention(v.slice(0, 60))} placeholder="Mon intention (facultatif)" placeholderTextColor="#6B7183"
          style={st.input} returnKeyType="done" accessibilityLabel="Mon intention" />
        <PrimaryButton title={`M’engager pour ${days} ${days > 1 ? 'jours' : 'jour'}`} icon="shieldCheck" onPress={async () => {
          const ok = await startEngagement(days, intention);
          if (ok) { haptic.success(); setIntention(''); onChange(); }
          else { haptic.error(); Alert.alert('Temps d’écran requis', 'Autorise Temps d’écran pour Noor Salat, puis réessaie.'); }
        }} />
        {kept > 0 && <T style={{ fontSize: 12, color: C.gold, textAlign: 'center' }}>Engagements tenus : {kept}</T>}
      </Card>
    </Rise>
  );
}
