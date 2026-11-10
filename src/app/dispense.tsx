import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../components/Screen';
import { PageHeader, Section } from '../components/PageHeader';
import { Label, T } from '../components/Text';
import { Icon } from '../components/Icon';
import { Card, GhostButton, PrimaryButton, Ring, Rise, Row, Toggle } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { dateCourte } from '../lib/format';
import {
  DispenseSettings, PeriodKind, currentDay, currentPeriod, cycleStats, deletePeriod, endDispense, getDispense,
  setDispensePrefs, shiftCurrentStart, startDispense,
} from '../lib/dispense';
import { scheduleDay, unlock } from '../lib/blocker';

const fr = (k: string) => { const [y, m, d] = k.split('-').map(Number); return dateCourte(new Date(y, m - 1, d, 12)); };
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Dispense (règles, après un accouchement) et suivi du cycle. Tout reste sur le téléphone. */
export default function Dispense() {
  const [s, setS] = useState<DispenseSettings | null>(null);
  const [ago, setAgo] = useState(0);
  const load = useCallback(() => { getDispense().then(setS); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!s) return <Screen nav={false}><PageHeader title="Dispense" /></Screen>;
  const cur = currentPeriod(s);
  const stats = cycleStats(s);
  const history = [...s.periods].filter((p) => p.end).reverse().slice(0, 8);

  async function begin(kind: PeriodKind) {
    haptic.success();
    await startDispense(kind, ago);
    unlock();                 // applis libérées et réveil arrêté tout de suite
    await scheduleDay();      // plus de blocage, de réveil ni de rappels de prière
    setAgo(0);
    load();
  }
  async function finish() {
    haptic.success();
    await endDispense();
    await scheduleDay();      // blocages, réveil et rappels reviennent
    load();
  }

  return (
    <Screen nav={false}>
      <PageHeader title="Dispense" subtitle="Règles · après un accouchement" />

      {cur ? (
        <Rise>
          <Card gold style={{ paddingVertical: 22, gap: 16, alignItems: 'center' }}>
            <Ring size={120} stroke={6} value={Math.min(1, currentDay(cur) / (stats.duration ?? 7))} duration={1200}>
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <T style={{ fontSize: 34, fontFamily: F.light }}>{currentDay(cur)}</T>
                <T style={{ fontSize: 11, color: C.dim }}>{currentDay(cur) > 1 ? 'jours' : 'jour'}</T>
              </View>
            </Ring>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <T style={{ fontSize: 16 }}>{cur.kind === 'nifas' ? 'Après l’accouchement' : 'Dispense en cours'}</T>
              <T style={{ fontSize: 13, color: C.dim, textAlign: 'center' }}>Depuis le {lower(fr(cur.start))}{stats.duration && cur.kind === 'regles' ? ` · d’habitude ${stats.duration} jours` : ''}</T>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T style={{ fontSize: 12, color: C.faint }}>Date de début</T>
              <Pressable onPress={() => { haptic.tap(); shiftCurrentStart(-1).then(load); }} style={st.mini} accessibilityLabel="Un jour plus tôt"><Icon name="minus" size={14} color={C.text} /></Pressable>
              <Pressable onPress={() => { haptic.tap(); shiftCurrentStart(1).then(load); }} style={st.mini} accessibilityLabel="Un jour plus tard"><Icon name="plus" size={14} color={C.text} /></Pressable>
            </View>
            <PrimaryButton title="C’est terminé, je reprends" icon="check" gold onPress={finish} style={{ alignSelf: 'stretch' }} />
          </Card>
        </Rise>
      ) : (
        <Rise>
          <Card style={{ paddingVertical: 20, gap: 14 }}>
            <Label>Mettre ma pause</Label>
            <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>Pendant la dispense : pas de blocage, pas de réveil du Fajr, pas de rappel de prière. Ta série et ton Noor restent intacts.</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T style={{ flex: 1, fontSize: 13, color: C.dim }}>{ago === 0 ? 'Commencé aujourd’hui' : `Commencé il y a ${ago} jour${ago > 1 ? 's' : ''}`}</T>
              <Pressable onPress={() => { haptic.tap(); setAgo(Math.max(0, ago - 1)); }} style={st.mini} accessibilityLabel="Moins de jours"><Icon name="minus" size={14} color={C.text} /></Pressable>
              <Pressable onPress={() => { haptic.tap(); setAgo(Math.min(10, ago + 1)); }} style={st.mini} accessibilityLabel="Plus de jours"><Icon name="plus" size={14} color={C.text} /></Pressable>
            </View>
            <PrimaryButton title="Mes règles ont commencé" gold onPress={() => begin('regles')} />
            <GhostButton title="Après un accouchement" onPress={() => begin('nifas')} />
          </Card>
        </Rise>
      )}

      {stats.count > 0 && (
        <>
          <Section>Mon cycle</Section>
          <Card style={{ paddingVertical: 16, gap: 10 }}>
            {!cur && stats.next && (
              <View style={{ gap: 2 }}>
                <T style={{ fontSize: 12, color: C.dim }}>Prochaines règles estimées vers le</T>
                <Text style={{ fontFamily: F.serif, fontSize: 28, color: C.goldBright }}>{lower(dateCourte(stats.next))}</Text>
                {!stats.reliable && <T style={{ fontSize: 11, color: C.faint }}>Estimation approximative : elle s’affine après quelques cycles.</T>}
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={st.stat}><T style={st.big}>{stats.cycle ?? '—'}</T><T style={st.small}>jours de cycle</T></View>
              <View style={st.stat}><T style={st.big}>{stats.duration ?? '—'}</T><T style={st.small}>jours de règles</T></View>
            </View>
          </Card>
        </>
      )}

      <Section>Réglages</Section>
      <Card>
        <Row title="Rappels doux de dhikr" sub="À l’heure des prières, pendant la dispense"
          right={<Toggle value={s.dhikr} label="Rappels doux de dhikr" onChange={async (v) => { await setDispensePrefs({ dhikr: v }); load(); scheduleDay().catch(() => {}); }} />} />
        <Row last title="Me prévenir à la date estimée" sub="Un rappel discret pour mettre ta pause"
          right={<Toggle value={s.predict} label="Me prévenir à la date estimée" onChange={async (v) => { await setDispensePrefs({ predict: v }); load(); scheduleDay().catch(() => {}); }} />} />
      </Card>

      {history.length > 0 && (
        <>
          <Section>Historique</Section>
          <Card>
            {history.map((p, i) => (
              <Row key={p.start} last={i === history.length - 1} title={`${fr(p.start)} → ${lower(fr(p.end!))}`}
                sub={p.kind === 'nifas' ? 'Après un accouchement' : 'Règles'}
                onPress={() => Alert.alert('Supprimer cette période ?', 'Elle ne comptera plus dans le calcul du cycle.', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => deletePeriod(p.start).then(load) },
                ])} />
            ))}
          </Card>
        </>
      )}

      <T style={{ fontSize: 11, lineHeight: 17, color: C.faint, textAlign: 'center' }}>Ces informations restent uniquement sur ton téléphone : elles ne sont jamais envoyées ni sauvegardées en ligne. C’est toi qui décides quand la dispense commence et finit.</T>
    </Screen>
  );
}

const st = StyleSheet.create({
  mini: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center' },
  big: { fontSize: 26, fontFamily: F.light },
  small: { fontSize: 11, color: C.dim },
});
