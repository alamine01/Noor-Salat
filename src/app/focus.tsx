import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../components/Screen';
import { PageHeader } from '../components/PageHeader';
import { T } from '../components/Text';
import { Icon } from '../components/Icon';
import { Chip, Halo, HoldButton, PrimaryButton, Ring, Rise, useLoop } from '../components/ui';
import { C, F } from '../lib/theme';
import { clock } from '../lib/format';
import { FOCUS_LEVELS, FocusLevel, FocusSession, getFocusLevel, getFocusSession, levelText } from '../lib/store';
import { FOCUS_PAUSES, blockingReady, canReallyBlock, resumeFocus, startFocus, stopFocus } from '../lib/blocker';
import { router } from 'expo-router';
import { screenTimeStatus, selectionCount } from '../lib/ios';
import { Tip, markGuide } from '../components/Guide';

const PRESETS = [
  { label: '25 min', min: 25 },
  { label: '1 h', min: 60 },
  { label: "Jumu'a", min: 90 },
  { label: 'Nuit', min: 480 },
];

/** Session Focus : met les applis en pause en dehors des prières (Android), minuteur ailleurs. */
export default function Focus() {
  const [p, setP] = useState(1);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [askPause, setAskPause] = useState(false);
  useEffect(() => { markGuide('focus'); }, []);
  const [lv, setLv] = useState<FocusLevel>(FOCUS_LEVELS.moyen);
  const [pauseMin, setPauseMin] = useState(10);

  const load = useCallback(async () => {
    const s = await getFocusSession();
    if (s && s.endAt <= Date.now()) { await stopFocus(); setSession(null); } else setSession(s);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  // Pendant une session : le niveau figé au départ. Sinon : celui des Réglages (affiché seulement, réglable dans Réglages).
  useEffect(() => {
    if (session?.level) setLv(FOCUS_LEVELS[session.level]);
    else getFocusLevel().then(setLv);
  }, [session?.level]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (session && session.endAt <= now) { stopFocus(); setSession(null); }
    // Fin de pause : la session reprend (iOS a déjà remis le blocage ; Android relance le gardien).
    else if (session?.pauseUntil && session.pauseUntil <= now) { resumeFocus(); setSession({ ...session, pauseUntil: undefined }); }
  }, [session, now]);
  const paused = !!session?.pauseUntil && session.pauseUntil > now;

  const total = (session?.minutes ?? PRESETS[p].min) * 60;
  const left = session ? (session.endAt - now) / 1000 : total;
  const orbit = useLoop(24000);

  async function begin() {
    const m = PRESETS[p].min;
    // iPhone : sans autorisation ou sans applis choisies, iOS ne bloque rien. On le dit au lieu de faire semblant.
    if (Platform.OS === 'ios') {
      const ok = screenTimeStatus();
      const n = selectionCount();
      if (ok !== 'approved' || n === 0) {
        Alert.alert(
          'Aucune appli ne sera bloquée',
          ok !== 'approved'
            ? "Temps d'écran n'est pas autorisé pour Noor Salat (état : " + ok + ")."
            : "iOS ne voit aucune appli dans ta liste. Rechoisis-les dans Réglages › Blocage.",
        );
        return;
      }
    }
    const endAt = await startFocus(m);
    setSession({ endAt, minutes: m });
  }
  async function end() {
    await stopFocus();
    setSession(null);
  }

  return (
    <Screen>
      <PageHeader back={false} title="Session Focus" subtitle="En dehors des prières" />
      <Tip id="focus" title="Focus, c’est quoi ?">Choisis une durée, puis touche « Commencer » : tes applis sont en pause pour que tu restes concentré. Une pause ou un arrêt demandent de lire des versets d’abord.</Tip>

      <View style={{ alignSelf: 'center', width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
        <Halo size={190} opacity={0.3} />
        <Ring size={240} stroke={3} value={session ? 1 - left / total : 0} duration={900} gradient={false}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
            <View style={{ position: 'absolute', left: 116, top: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: C.goldBright, shadowColor: C.goldBright, shadowOpacity: 1, shadowRadius: 8 }} />
          </Animated.View>
          <View style={{ position: 'absolute', alignItems: 'center', gap: 6 }}>
            <Icon name="moon" size={26} color={C.gold} stroke={1.6} />
            <Text style={{ fontFamily: F.thin, fontSize: 52, lineHeight: 58, color: C.text, fontVariant: ['tabular-nums'] }}>{clock(left)}</Text>
            <T style={{ fontSize: 12, color: C.dim }}>{paused ? 'en pause' : session ? 'session en cours' : 'prêt'}</T>
          </View>
        </Ring>
      </View>

      {!session && (
        <Rise delay={150} style={{ flexDirection: 'row', gap: 8 }}>
          {PRESETS.map((x, i) => <Chip key={x.label} label={x.label} on={i === p} onPress={() => setP(i)} style={{ flex: 1, height: 44, borderRadius: 14 }} />)}
        </Rise>
      )}

      <Rise delay={250} style={st.card}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Icon name="lock" size={18} color={C.gold} stroke={1.8} />
          <T style={{ flex: 1, fontSize: 14 }}>
            {canReallyBlock ? 'Toutes les applis sont mises en pause' : Platform.OS === 'ios' && blockingReady() ? 'Tes applis choisies sont mises en pause' : 'Minuteur de concentration'}
          </T>
        </View>
        <T style={{ fontSize: 12, lineHeight: 18, color: C.dim, marginTop: 8 }}>
          {canReallyBlock
            ? "Le téléphone et les appels d'urgence restent ouverts. Le choix des applis à bloquer arrive dans une prochaine version."
            : Platform.OS === 'ios'
              ? blockingReady()
                ? "Les mêmes applis qu'à l'heure de la prière (modifiables dans Réglages). 15 minutes minimum, règle d'Apple."
                : "Pour mettre tes applis en pause, autorise Temps d'écran et choisis tes applis dans Réglages."
              : 'Sur le web, seule la minuterie fonctionne.'}
        </T>
        {Platform.OS === 'ios' && !blockingReady() && (
          <T onPress={() => router.push('/parametres')} style={{ fontSize: 13, color: C.gold, marginTop: 10 }}>Ouvrir les réglages</T>
        )}
      </Rise>

      <View style={{ alignItems: 'center', gap: 10, marginTop: 4 }}>
        {session ? (
          <>
            {paused ? (
              <View style={[st.card, { alignSelf: 'stretch', gap: 10, alignItems: 'center' }]}>
                <T style={{ fontSize: 13, color: C.gold }}>Pause · tes applis sont libres</T>
                <Text style={{ fontFamily: F.thin, fontSize: 40, color: C.text, fontVariant: ['tabular-nums'] }}>{clock((session!.pauseUntil! - now) / 1000)}</Text>
                <T style={{ fontSize: 12, color: C.dim, textAlign: 'center' }}>Le blocage revient tout seul à la fin de la pause.</T>
                <PrimaryButton title="Reprendre maintenant" style={{ alignSelf: 'stretch' }} onPress={async () => { await resumeFocus(); load(); }} />
              </View>
            ) : askPause ? (
              <View style={[st.card, { alignSelf: 'stretch', gap: 12 }]}>
                <T style={{ fontSize: 14 }}>Une courte pause</T>
                <T style={{ fontSize: 12, lineHeight: 18, color: C.dim }}>D'abord {levelText(lv)} (niveau {lv.label.toLowerCase()}). Ensuite, tes applis sont libres le temps choisi, puis la session reprend toute seule.</T>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {FOCUS_PAUSES.map((m) => <Chip key={m} label={`${m} min`} on={pauseMin === m} onPress={() => setPauseMin(m)} style={{ flex: 1, height: 44, borderRadius: 14 }} />)}
                </View>
                <PrimaryButton title={`Lire ${lv.verses} versets · pause de ${pauseMin} min`} onPress={() => { setAskPause(false); router.push({ pathname: '/versets', params: { pause: String(pauseMin) } }); }} />
                <T onPress={() => setAskPause(false)} style={{ fontSize: 13, color: C.dim, textAlign: 'center', paddingVertical: 4 }}>Non, je reste concentré</T>
              </View>
            ) : (
              <T onPress={() => setAskPause(true)} accessibilityRole="button" style={{ fontSize: 14, color: C.gold, paddingVertical: 6 }}>Besoin d'une pause ?</T>
            )}
            <HoldButton label="MAINTIENS POUR ARRÊTER" width={330} duration={2000} onDone={() => router.push({ pathname: '/versets', params: { stop: '1' } })} />
            <T style={{ fontSize: 11, color: C.faint, textAlign: 'center' }}>Pour arrêter : {levelText(lv)} · niveau {lv.label.toLowerCase()}</T>
          </>
        ) : (
          <PrimaryButton title="Commencer" style={{ alignSelf: 'stretch' }} onPress={begin} />
        )}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 24, padding: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
});
