import { ComponentType, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Gender } from '../lib/dispense';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ar, T, Text, TextInput } from './Text';
import { Icon } from './Icon';
import { Backdrop, HoldButton, ND, Ripples, Rise, useBreath, useLoop } from './ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { NoorBlocker } from '../../modules/noor-blocker';
import { canReallyBlock, permissionsStatus, scheduleDay, setupNotifications } from '../lib/blocker';
import { alarmKitAuthorized, alarmKitAvailable, isIOS, requestAlarmKit, requestScreenTime, screenTimeAvailable, screenTimeStatus, selectionCount, SELECTION_ID } from '../lib/ios';
import { getFajr, setBlockEnabled, setFajr, setNotifStyle, setTahajjud } from '../lib/store';
import { loadTodayTimes, nextPrayer, nightThirds } from '../lib/prayer';

export const ONBOARDING_KEY = 'onboarding:done';

/** Déjà passé l'onboarding ? Tout le monde le voit une fois, y compris les testeurs d'avant. */
export async function onboardingDone() {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === '1';
}

const LAST = 12;
type Set = Record<string, boolean>;

const P = {
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  work: 'M3 8h18v11H3zM9 8V5h6v3',
  moon: 'M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  sofa: 'M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 11h18v6H3zM5 17v2M19 17v2',
};

/** Premier lancement : 13 écrans qui construisent le plan de l'utilisateur et règlent vraiment l'appli. */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGenderS] = useState<Gender | null>(null);
  const [prayers, setPrayers] = useState<number | null>(null);
  const [obst, setObst] = useState<Set>({});
  const [hours, setHours] = useState(5);
  const [goals, setGoals] = useState<Set>({});
  const [sworn, setSworn] = useState(false);

  const go = useCallback((n: number) => { haptic.tap(); setStep(n); }, []);
  const ok = step === 1 ? name.trim().length > 0 && gender !== null : step === 2 ? prayers !== null : step === 3 ? Object.values(obst).some(Boolean) : step === 6 ? Object.values(goals).some(Boolean) : true;
  const next = () => {
    if (!ok) return haptic.error();
    if (step < LAST) go(step + 1);
  };
  const back = () => { if (step > 0) go(step === 8 ? 6 : step - 1); };
  const who = name.trim() || 'toi';

  async function finish() {
    haptic.success();
    // Les réponses règlent l'appli.
    const fajr = await getFajr();
    await setFajr({ ...fajr, enabled: !!(goals.fajr || obst.sommeil) || fajr.enabled });
    // La présentation peut ACTIVER le blocage, jamais le désactiver (sinon la refaire coupait le blocage sans prévenir).
    if (goals.cinq || goals.reseaux || obst.tel || !Object.values(goals).some(Boolean)) await setBlockEnabled(true);
    await setNotifStyle(obst.oubli || goals.cinq ? 'complet' : 'essentiel');
    if (goals.tahajjud) {
      const d = await loadTodayTimes().catch(() => null);
      if (d) {
        const t2 = nightThirds(d.times).t2;
        t2.setMinutes(Math.ceil(t2.getMinutes() / 15) * 15, 0, 0);
        await setTahajjud({ on: true, minutes: t2.getHours() * 60 + t2.getMinutes() });
      }
    }
    await AsyncStorage.multiSet([
      [ONBOARDING_KEY, '1'],
      ['profile:name', name.trim()],
      ['profile:gender', gender ?? ''],
      ['onboarding:answers', JSON.stringify({ prayers, obst, hours, goals, at: new Date().toISOString() })],
    ]);
    await setupNotifications().catch(() => {});
    scheduleDay().catch(() => {});
    onDone();
  }

  const top = step > 0 && step < LAST && step !== 7;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#05060B' }]}>
      <Backdrop stars top="#161A2C" bottom="#05060B" />
      <SafeAreaView style={{ flex: 1 }}>
        {top && (
          <View style={st.top}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Retour" style={st.backBtn}><Icon name="back" size={18} color={C.soft} /></Pressable>
            <View style={st.track}><Bar value={step / LAST} /></View>
          </View>
        )}
        <View style={{ flex: 1 }} key={step}>
          {step === 0 && <Welcome onNext={next} />}
          {step === 1 && (
            <Page kicker="FAISONS CONNAISSANCE" title="Comment veux-tu qu'on t'appelle ?" cta="Continuer" ok={ok} onNext={next}>
              <Rise delay={250} style={{ marginTop: 34 }}>
                <T style={{ fontSize: 12, color: C.faint, marginBottom: 8 }}>Ton prénom</T>
                <TextInput value={name} onChangeText={(v) => setName(v.slice(0, 24))} placeholder="Ex. Aminata" placeholderTextColor="#6B7183" autoFocus autoCapitalize="words"
                  autoComplete="given-name" textContentType="givenName" returnKeyType="next" onSubmitEditing={next} accessibilityLabel="Ton prénom"
                  style={[st.input, { borderColor: name ? 'rgba(226,192,141,0.6)' : C.line2 }]} />
                <T style={{ fontSize: 12, color: C.faint, marginTop: 22, marginBottom: 8 }}>Tu es</T>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {([['homme', 'Un frère'], ['femme', 'Une sœur']] as const).map(([k, label]) => {
                    const on = gender === k;
                    return (
                      <Pressable key={k} onPress={() => { haptic.tap(); setGenderS(k); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                        style={[st.box, { flex: 1, width: '48%', height: 56 }, on && st.boxOn]}>
                        <T style={{ fontSize: 15, color: on ? C.goldBright : C.text }}>{label}</T>
                      </Pressable>
                    );
                  })}
                </View>
                <T style={{ fontSize: 12, color: C.faint, marginTop: 12 }}>Ces réponses restent sur ton téléphone.</T>
              </Rise>
            </Page>
          )}
          {step === 2 && (
            <Page kicker={`ENCHANTÉ, ${who.toUpperCase()}`} title="Combien de prières fais-tu à l'heure, un jour normal ?" sub="Sois honnête : personne d'autre ne le saura." cta="Continuer" ok={ok} onNext={next}>
              <Rise delay={280} style={{ marginTop: 30, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {[0, 1, 2, 3, 4, 5].map((n) => {
                  const on = prayers === n;
                  return (
                    <Pressable key={n} onPress={() => { haptic.tap(); setPrayers(n); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                      style={[st.box, on && st.boxOn]}>
                      <Text style={{ fontFamily: F.serif, fontSize: 40, lineHeight: 44, color: on ? C.goldBright : C.text }}>{n}</Text>
                      <T style={{ fontSize: 11, color: C.faint }}>{n === 0 ? 'aucune' : n === 5 ? 'toutes' : n === 1 ? 'prière' : 'prières'}</T>
                    </Pressable>
                  );
                })}
              </Rise>
            </Page>
          )}
          {step === 3 && (
            <Page kicker="CE QUI TE RETIENT" title="Qu'est-ce qui te fait rater une prière ?" sub="Choisis tout ce qui te parle." cta="Continuer" ok={ok} onNext={next}>
              <Rise delay={280} style={{ marginTop: 22, gap: 10 }}>
                {([['tel', 'Le téléphone et les réseaux', P.phone], ['travail', 'Le travail ou les études', P.work], ['sommeil', 'Le sommeil, surtout au Fajr', P.moon], ['oubli', "J'oublie l'heure", P.clock], ['flemme', 'La flemme, je repousse', P.sofa]] as const).map(([k, label, d]) => (
                  <Option key={k} on={!!obst[k]} onPress={() => setObst({ ...obst, [k]: !obst[k] })} label={label}
                    icon={<Svg width={18} height={18} viewBox="0 0 24 24"><Path d={d} fill="none" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>} />
                ))}
              </Rise>
            </Page>
          )}
          {step === 4 && (
            <Page kicker="TON TÉLÉPHONE" title="Combien d'heures passes-tu sur ton téléphone par jour ?" cta="Voir ce que ça représente" gold onNext={next}>
              <Rise delay={250} style={{ marginTop: 50, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 26 }}>
                  <Pressable onPress={() => { haptic.tap(); setHours(Math.max(1, hours - 1)); }} style={st.step} accessibilityRole="button" accessibilityLabel="Une heure de moins"><Icon name="minus" size={22} color={C.text} /></Pressable>
                  <Text style={{ fontFamily: F.serif, fontSize: 110, lineHeight: 116, color: C.goldBright, textShadowColor: 'rgba(243,217,164,0.35)', textShadowRadius: 30 }}>{hours}<Text style={{ fontSize: 44, color: C.soft }}> h</Text></Text>
                  <Pressable onPress={() => { haptic.tap(); setHours(Math.min(14, hours + 1)); }} style={st.step} accessibilityRole="button" accessibilityLabel="Une heure de plus"><Icon name="plus" size={22} color={C.text} /></Pressable>
                </View>
                <T style={{ fontSize: 13, color: C.faint, marginTop: 10 }}>{hours >= 6 ? 'Comme la plupart d’entre nous.' : hours >= 3 ? 'C’est déjà beaucoup de temps.' : 'Tu es déjà raisonnable, mash’Allah.'}</T>
                <T style={{ fontSize: 11, color: C.faint, marginTop: 18, textAlign: 'center' }}>{isIOS ? 'Réglages › Temps d’écran te donne le chiffre exact.' : 'Paramètres › Bien-être numérique te donne le chiffre exact.'}</T>
              </Rise>
            </Page>
          )}
          {step === 5 && <Shock hours={hours} onNext={next} />}
          {step === 6 && (
            <Page kicker="TES INTENTIONS" title="Que veux-tu construire, in shâ Allah ?" cta="Créer mon plan" ok={ok} onNext={next}>
              <Rise delay={250} style={{ marginTop: 22, gap: 10 }}>
                {([['cinq', 'Prier les 5 prières à l’heure', 'Rappels + pause des distractions'], ['fajr', 'Ne plus rater le Fajr', 'Vrai réveil, scan du tapis'], ['reseaux', 'Moins de réseaux sociaux', 'Sessions Focus et pauses'], ['coran', 'Revenir au Coran', 'Quelques versets chaque jour'], ['tahajjud', 'Prier la nuit (Tahajjud)', 'Un rappel doux au dernier tiers']] as const).map(([k, label, sub]) => (
                  <Option key={k} on={!!goals[k]} onPress={() => setGoals({ ...goals, [k]: !goals[k] })} label={label} sub={sub} />
                ))}
              </Rise>
            </Page>
          )}
          {step === 7 && <Preparing onDone={() => setStep(8)} />}
          {step === 8 && <Plan who={who} prayers={prayers ?? 0} obst={obst} goals={goals} onNext={next} />}
          {step === 9 && (
            <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 40, alignItems: 'center' }}>
              <Rise><T style={st.kicker}>TON ENGAGEMENT</T></Rise>
              <Rise delay={150}>
                <Text style={{ fontFamily: F.serif, fontSize: 30, lineHeight: 39, color: C.text, textAlign: 'center', marginTop: 24 }}>
                  « Moi, <Text style={{ fontFamily: F.serifItalic, color: C.gold }}>{who}</Text>, je m'engage à faire de mon mieux pour prier à l'heure, et à revenir chaque fois que je tombe. »
                </Text>
              </Rise>
              <Rise delay={300}><T style={{ fontSize: 13, lineHeight: 20, color: C.faint, textAlign: 'center', marginTop: 18 }}>L'œuvre la plus aimée d'Allah est celle qui est régulière, même si elle est petite. (Hadith, Al-Bukhari et Muslim)</T></Rise>
              <View style={{ flex: 1 }} />
              <Rise delay={500} style={{ alignItems: 'center', gap: 12, paddingBottom: 24 }}>
                <HoldButton label={sworn ? 'BISMILLAH' : 'MAINTIENS POUR T’ENGAGER'} width={320} duration={2200}
                  onDone={() => { setSworn(true); setTimeout(() => go(10), 1100); }} />
                <T style={{ fontSize: 12, color: C.faint }}>{sworn ? 'Qu’Allah te facilite.' : 'Garde le doigt appuyé jusqu’au bout'}</T>
              </Rise>
            </View>
          )}
          {step === 10 && <Permissions onNext={next} />}
          {step === 11 && <Apps onNext={next} />}
          {step === 12 && <Final who={who} onDone={finish} />}
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ---------- Briques ---------- */

function Bar({ value }: { value: number }) {
  const v = useRef(new Animated.Value(value)).current;
  useEffect(() => { Animated.timing(v, { toValue: value, duration: 600, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start(); }, [v, value]);
  return <Animated.View style={{ height: 4, borderRadius: 2, backgroundColor: C.gold, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />;
}

function Page({ kicker, title, sub, cta, ok = true, gold, onNext, children }: { kicker: string; title: string; sub?: string; cta: string; ok?: boolean; gold?: boolean; onNext: () => void; children?: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Rise><T style={st.kicker}>{kicker}</T></Rise>
        {!!title && <Rise delay={100}><Text style={st.title}>{title}</Text></Rise>}
        {sub && <Rise delay={180}><T style={{ fontSize: 13, color: C.dim, marginTop: 10 }}>{sub}</T></Rise>}
        {children}
      </ScrollView>
      <Cta title={cta} ok={ok} gold={gold} onPress={onNext} />
    </View>
  );
}

function Cta({ title, ok = true, gold, onPress }: { title: string; ok?: boolean; gold?: boolean; onPress: () => void }) {
  const sheen = useLoop(3500, 600);
  const lit = ok || gold;
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ disabled: !ok }}
        style={({ pressed }) => [st.cta, { backgroundColor: lit ? C.gold : 'rgba(255,255,255,0.07)', transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        {lit && <LinearGradient colors={[C.gold, '#F6E3BC', C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
        {lit && (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: 80, opacity: 0.5, transform: [{ translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-120, 420] }) }, { skewX: '-20deg' }] }}>
            <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
          </Animated.View>
        )}
        <Text style={{ zIndex: 1, fontFamily: F.semibold, fontSize: 16, color: lit ? C.ink : '#6B7183' }}>{title}</Text>
      </Pressable>
    </View>
  );
}

function Option({ on, onPress, label, sub, icon }: { on: boolean; onPress: () => void; label: string; sub?: string; icon?: ReactNode }) {
  return (
    <Pressable onPress={() => { haptic.tap(); onPress(); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={({ pressed }) => [st.opt, on && st.optOn, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      {icon && <View style={st.optIcon}>{icon}</View>}
      <View style={{ flex: 1 }}>
        <T style={{ fontSize: 15 }}>{label}</T>
        {sub && <T style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{sub}</T>}
      </View>
      <View style={[st.check, on && { backgroundColor: C.gold, borderColor: C.gold }]}>{on && <Icon name="check" size={13} color={C.ink} stroke={3} />}</View>
    </Pressable>
  );
}

function Rays({ size, opacity = 0.75 }: { size: number; opacity?: number }) {
  const spin = useLoop(50000);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', top: -80, opacity, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <Svg width={size} height={size} viewBox="0 0 640 640">
        <Defs><RadialGradient id="obr" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={C.goldBright} stopOpacity={0.2} /><Stop offset="1" stopColor={C.goldBright} stopOpacity={0} /></RadialGradient></Defs>
        <G fill="url(#obr)">
          <Path d="M320 320 312 0h16z" /><Path d="M320 320 640 312v16z" /><Path d="M320 320 328 640h-16z" /><Path d="M320 320 0 328v-16z" />
          <Path d="M320 320 540 90l12 12z" /><Path d="M320 320 550 540l-12 12z" /><Path d="M320 320 100 550l-12-12z" /><Path d="M320 320 90 100l12-12z" />
        </G>
      </Svg>
    </Animated.View>
  );
}

function Orb({ size }: { size: number }) {
  const b = useBreath(6000);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ripples size={size} count={2} duration={5000} />
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', transform: [{ scale: b.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }], shadowColor: C.goldBright, shadowOpacity: 0.6, shadowRadius: 40 }}>
        <LinearGradient colors={['#FFF4DC', C.goldBright, C.goldDeep]} start={{ x: 0.3, y: 0.2 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/* ---------- Écrans ---------- */

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Rays size={700} />
      <View style={{ alignItems: 'center', marginTop: 70 }}><Orb size={150} /></View>
      <Rise delay={300} style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 28 }}>
        <Ar style={{ fontSize: 26, lineHeight: 46, color: C.goldBright, textAlign: 'center' }}>وَأَقِمِ ٱلصَّلَوٰةَ لِذِكۡرِيٓ</Ar>
        <Text style={{ fontFamily: F.serifItalic, fontSize: 18, color: C.soft, textAlign: 'center', marginTop: 4 }}>« Accomplis la prière pour te souvenir de Moi. »</Text>
        <T style={{ fontSize: 11, letterSpacing: 1.8, color: C.faint, marginTop: 6 }}>TA-HA · 20:14</T>
      </Rise>
      <Rise delay={700} style={{ alignItems: 'center', marginTop: 30, paddingHorizontal: 28 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 40, lineHeight: 44, color: C.text, textAlign: 'center' }}>Reviens à la prière,{'\n'}<Text style={{ fontFamily: F.serifItalic, color: C.gold }}>une à la fois.</Text></Text>
        <T style={{ fontSize: 14, lineHeight: 21, color: C.dim, textAlign: 'center', marginTop: 12 }}>Deux minutes pour construire ton plan. Noor Salat s'occupe du reste.</T>
      </Rise>
      <View style={{ flex: 1 }} />
      <Rise delay={1100}><Cta title="Commencer" onPress={onNext} /></Rise>
    </View>
  );
}

function Shock({ hours, onNext }: { hours: number; onNext: () => void }) {
  // Sur les 50 prochaines années : heures/jour ÷ 24 × 50. Affiché en dixièmes.
  const target = Math.round((hours / 24) * 50 * 10);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(target, v + Math.max(1, Math.round(target / 35)));
      setShown(v);
      if (v >= target) { clearInterval(id); haptic.medium(); }
    }, 35);
    return () => clearInterval(id);
  }, [target]);
  const days = Math.round((hours * 365) / 24);
  const share = Math.max(1, Math.round((25 / (hours * 60)) * 100));
  return (
    <Page kicker="UN CHIFFRE QUI FAIT RÉFLÉCHIR" title="" cta="Je veux changer ça" gold onNext={onNext}>
      <Rise delay={150}><T style={{ fontSize: 16, color: C.dim, marginTop: 18 }}>{hours} h par jour, sur les 50 prochaines années, c'est</T></Rise>
      <Rise delay={350}>
        <Text style={{ fontFamily: F.serif, fontSize: 96, lineHeight: 104, color: C.goldBright, textShadowColor: 'rgba(243,217,164,0.35)', textShadowRadius: 40 }}>
          {(shown / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<Text style={{ fontSize: 36, color: C.text }}> ans</Text>
        </Text>
      </Rise>
      <Rise delay={500}><T style={{ fontSize: 16, lineHeight: 23, color: C.dim }}>de ta vie, les yeux sur un écran. Soit {days} jours chaque année.</T></Rise>
      <Rise delay={1100} style={{ marginTop: 34, gap: 14 }}>
        <Meter label="Téléphone" right={`${hours} h / jour`} value={hours / 14} colors={['#6B7183', C.dim]} />
        <Meter label="Les 5 prières" right="≈ 25 min / jour" value={25 / 60 / 14} colors={[C.goldDeep, C.goldBright]} />
      </Rise>
      <Rise delay={1600}>
        <Text style={{ fontFamily: F.serifItalic, fontSize: 22, lineHeight: 30, color: C.text, marginTop: 30 }}>
          Il ne s'agit pas de tout quitter. Juste de rendre à Allah <Text style={{ color: C.gold }}>{share} %</Text> de ce temps.
        </Text>
      </Rise>
    </Page>
  );
}

function Meter({ label, right, value, colors }: { label: string; right: string; value: number; colors: [string, string] }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: Math.max(0.03, Math.min(1, value)), duration: 1400, delay: 1200, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start(); }, [v, value]);
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <T style={{ fontSize: 12, color: C.soft }}>{label}</T><T style={{ fontSize: 12, color: C.soft }}>{right}</T>
      </View>
      <View style={{ height: 12, borderRadius: 6, backgroundColor: C.surface2, overflow: 'hidden' }}>
        <Animated.View style={{ height: 12, borderRadius: 6, overflow: 'hidden', width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    </View>
  );
}

function Preparing({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const spin = useLoop(2400);
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(100, v + 2);
      setPct(v);
      if (v % 25 === 0) haptic.light();
      if (v >= 100) { clearInterval(id); setTimeout(onDone, 500); }
    }, 70);
    return () => clearInterval(id);
  }, [onDone]);
  const steps: [string, number][] = [['Heures de prière de ta ville', 20], ['Ton réveil du Fajr', 45], ['Les applis à mettre en pause', 70], ['Tes rappels personnalisés', 95]];
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 90 }}>
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
          <Svg width={200} height={200}><Path d="M100 8 A92 92 0 0 1 188 72" stroke={C.goldBright} strokeWidth={2.5} strokeLinecap="round" fill="none" /></Svg>
        </Animated.View>
        <View style={{ position: 'absolute', width: 184, height: 184, borderRadius: 92, borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)' }} />
        <Text style={{ fontFamily: F.serif, fontSize: 56, color: C.goldBright }}>{pct}<Text style={{ fontSize: 24 }}>%</Text></Text>
      </View>
      <Rise delay={100}><Text style={{ fontFamily: F.serif, fontSize: 32, color: C.text, marginTop: 34 }}>Nous préparons ton plan…</Text></Rise>
      <View style={{ marginTop: 28, gap: 16, alignSelf: 'stretch', paddingHorizontal: 48 }}>
        {steps.map(([label, at]) => {
          const done = pct >= at;
          return (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pct >= at - 20 ? 1 : 0.3 }}>
              <View style={[st.check, { width: 24, height: 24, borderRadius: 12 }, done && { backgroundColor: C.gold, borderColor: C.gold }]}>{done && <Icon name="check" size={12} color={C.ink} stroke={3.2} />}</View>
              <T style={{ fontSize: 14, color: C.soft }}>{label}</T>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Plan({ who, prayers, obst, goals, onNext }: { who: string; prayers: number; obst: Set; goals: Set; onNext: () => void }) {
  const items: { icon: Parameters<typeof Icon>[0]['name']; title: string; sub: string }[] = [];
  if (goals.fajr || obst.sommeil) items.push({ icon: 'sunrise', title: 'Réveil Fajr, 10 min avant l’adhan', sub: 'Il ne s’arrête qu’au scan de ton tapis' });
  if (goals.cinq || obst.tel || goals.reseaux) items.push({ icon: 'lock', title: 'Tes applis en pause à chaque prière', sub: '5 min après l’adhan, jusqu’au scan' });
  if (obst.oubli || goals.cinq) items.push({ icon: 'bell', title: 'Rappels : 10 min avant, à l’heure, +30 min', sub: 'Ils s’arrêtent dès que tu as prié' });
  if (goals.tahajjud) items.push({ icon: 'moon', title: 'Tahajjud au dernier tiers de la nuit', sub: 'Un rappel doux, sans blocage' });
  if (goals.coran) items.push({ icon: 'book', title: '5 versets par jour', sub: 'Lecture guidée, arabe et français' });
  if (items.length < 3) items.push({ icon: 'flame', title: 'Ta série, jour après jour', sub: 'Chaque prière validée compte' });
  return (
    <Page kicker="TON PLAN EST PRÊT" title={who === 'toi' ? 'Voici ton chemin.' : `${who}, voici ton chemin.`} cta="C'est mon plan" gold onNext={onNext}>
      <Rise delay={200} style={st.planCard}>
        <View>
          <T style={{ fontSize: 12, color: C.soft }}>Aujourd'hui</T>
          <Text style={{ fontFamily: F.serif, fontSize: 44, lineHeight: 48, color: C.text }}>{prayers}<Text style={{ fontSize: 20, color: C.faint }}>/5</Text></Text>
        </View>
        <View style={{ flex: 1, minWidth: 30, height: 40, marginHorizontal: 8 }}>
          <Svg width="100%" height={40} viewBox="0 0 120 40" preserveAspectRatio="none"><Path d="M2 34 C 30 32, 50 26, 70 18 S 105 5, 118 4" fill="none" stroke={C.goldBright} strokeWidth={2.5} strokeLinecap="round" /></Svg>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T numberOfLines={1} style={{ fontSize: 12, color: C.soft }}>Dans 30 jours</T>
          <Text style={{ fontFamily: F.serif, fontSize: 44, lineHeight: 48, color: C.goldBright }}>5<Text style={{ fontSize: 20, color: C.faint }}>/5</Text></Text>
        </View>
      </Rise>
      <View style={{ marginTop: 14, gap: 10 }}>
        {items.map((it, i) => (
          <Rise key={it.title} delay={350 + i * 120} style={st.planItem}>
            <View style={st.optIcon}><Icon name={it.icon} size={18} color={C.gold} stroke={1.8} /></View>
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 14 }}>{it.title}</T>
              <T style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{it.sub}</T>
            </View>
          </Rise>
        ))}
      </View>
    </Page>
  );
}

type Perm = { key: string; title: string; why: string; icon: Parameters<typeof Icon>[0]['name']; ok: boolean; ask: () => Promise<unknown> | void };

function Permissions({ onNext }: { onNext: () => void }) {
  const [state, setState] = useState<Record<string, boolean>>({});
  const refresh = useCallback(async () => {
    const loc = await Location.getForegroundPermissionsAsync().catch(() => null);
    const notif = await Notifications.getPermissionsAsync().catch(() => null);
    const s: Record<string, boolean> = { loc: !!loc?.granted, notif: !!notif?.granted };
    if (isIOS) {
      s.temps = screenTimeStatus() === 'approved';
      s.alarme = await alarmKitAuthorized();
    } else if (canReallyBlock) {
      const p = permissionsStatus();
      Object.assign(s, { usage: p.usage, overlay: p.overlay, exact: p.exact, battery: p.battery });
    }
    setState(s);
  }, []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (a) => a === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const perms: Perm[] = [
    { key: 'loc', title: 'Position', why: 'Pour les heures exactes de ta ville', icon: 'pin', ok: !!state.loc, ask: () => Location.requestForegroundPermissionsAsync() },
    { key: 'notif', title: 'Notifications', why: 'Pour l’adhan et tes rappels', icon: 'bell', ok: !!state.notif, ask: () => Notifications.requestPermissionsAsync() },
  ];
  if (isIOS) {
    if (screenTimeAvailable()) perms.push({ key: 'temps', title: 'Temps d’écran', why: 'Pour mettre tes applis en pause', icon: 'shield', ok: !!state.temps, ask: () => requestScreenTime() });
    if (alarmKitAvailable()) perms.push({ key: 'alarme', title: 'Alarmes', why: 'Pour un vrai réveil au Fajr, même en silencieux', icon: 'clock', ok: !!state.alarme, ask: () => requestAlarmKit() });
  } else if (canReallyBlock && NoorBlocker) {
    perms.push(
      { key: 'usage', title: 'Accès à l’utilisation', why: 'Pour savoir quelle appli est ouverte', icon: 'shield', ok: !!state.usage, ask: () => NoorBlocker!.openUsageAccessSettings() },
      { key: 'overlay', title: 'Affichage par-dessus', why: 'Pour montrer l’écran de prière', icon: 'lock', ok: !!state.overlay, ask: () => NoorBlocker!.openOverlaySettings() },
      { key: 'exact', title: 'Alarmes exactes', why: 'Pour sonner à la minute près', icon: 'clock', ok: !!state.exact, ask: () => NoorBlocker!.openExactAlarmSettings() },
      { key: 'battery', title: 'Batterie sans restriction', why: 'Pour que le téléphone ne coupe pas Noor Salat', icon: 'flame', ok: !!state.battery, ask: () => NoorBlocker!.openBatterySettings?.() },
    );
  }
  const all = perms.every((p) => p.ok);
  return (
    <Page kicker="POUR QUE ÇA MARCHE VRAIMENT" title={`${perms.length} autorisations, et ton plan s'active.`} cta={all ? 'Continuer' : 'Plus tard'} ok={all} gold={all} onNext={onNext}>
      <Rise delay={250} style={{ marginTop: 22, gap: 10 }}>
        {perms.map((p) => (
          <View key={p.key} style={[st.planItem, p.ok && { borderColor: 'rgba(226,192,141,0.45)' }]}>
            <View style={st.optIcon}><Icon name={p.icon} size={19} color={C.gold} stroke={1.8} /></View>
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 14 }}>{p.title}</T>
              <T style={{ fontSize: 12, lineHeight: 17, color: C.faint, marginTop: 2 }}>{p.why}</T>
            </View>
            {p.ok ? (
              <View style={[st.check, { width: 30, height: 30, borderRadius: 15, backgroundColor: C.gold, borderColor: C.gold }]}><Icon name="check" size={14} color={C.ink} stroke={3} /></View>
            ) : (
              <Pressable onPress={async () => { haptic.tap(); await p.ask(); await refresh(); }} accessibilityRole="button" accessibilityLabel={`Autoriser : ${p.title}`} style={st.allow}>
                <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.goldBright }}>Autoriser</Text>
              </Pressable>
            )}
          </View>
        ))}
      </Rise>
      {!all && <T style={{ fontSize: 11, color: C.faint, marginTop: 14, textAlign: 'center' }}>Tu pourras tout régler plus tard dans Réglages.</T>}
    </Page>
  );
}

// Liste d'Apple (Temps d'écran) : seulement sur iPhone avec le module natif.
type PickerProps = { style?: object; familyActivitySelectionId: string; headerText?: string; footerText?: string; onSelectionChange?: () => void; onDismissRequest?: () => void };
let Picker: ComponentType<PickerProps> | null | undefined;
function getPicker() {
  if (Picker === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Picker = (require('react-native-device-activity') as { DeviceActivitySelectionSheetViewPersisted: typeof Picker }).DeviceActivitySelectionSheetViewPersisted ?? null;
    } catch { Picker = null; }
  }
  return Picker;
}

function Apps({ onNext }: { onNext: () => void }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(() => (isIOS ? selectionCount() : 0));
  const PickerView = isIOS && screenTimeStatus() === 'approved' ? getPicker() : null;
  return (
    <Page kicker="À L'HEURE DE LA PRIÈRE" title="Qu'est-ce qu'on met en pause ?" sub="5 minutes après l'adhan, jusqu'au scan de ton tapis. Les appels restent toujours possibles." cta={count || !PickerView ? 'Activer' : 'Plus tard'} gold onNext={() => { scheduleDay().catch(() => {}); onNext(); }}>
      {PickerView ? (
        <Rise delay={250} style={{ marginTop: 26, gap: 14 }}>
          <Pressable onPress={() => { haptic.tap(); setOpen(true); }} accessibilityRole="button" style={[st.planItem, { minHeight: 76 }, count > 0 && { borderColor: 'rgba(226,192,141,0.45)' }]}>
            <View style={st.optIcon}><Icon name="lock" size={19} color={C.gold} stroke={1.8} /></View>
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 15 }}>{count ? `${count} élément${count > 1 ? 's' : ''} choisi${count > 1 ? 's' : ''}` : 'Choisir mes applis'}</T>
              <T style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>Réseaux sociaux, vidéos, jeux… dans la liste d'Apple</T>
            </View>
            <Icon name="chevron" size={16} color={C.faint} />
          </Pressable>
          <T style={{ fontSize: 12, lineHeight: 18, color: C.faint }}>Coche tes applis, puis touche le ✓ en haut à droite pour valider.</T>
        </Rise>
      ) : (
        <Rise delay={250} style={[st.planItem, { marginTop: 26 }]}>
          <View style={st.optIcon}><Icon name="lock" size={19} color={C.gold} stroke={1.8} /></View>
          <T style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
            {isIOS ? 'Autorise Temps d’écran à l’étape précédente pour choisir tes applis. Tu pourras aussi le faire dans Réglages.' : 'Toutes les applis sont mises en pause, sauf le téléphone et les appels d’urgence.'}
          </T>
        </Rise>
      )}
      {open && PickerView && (
        <View style={{ position: 'absolute', width: 1, height: 1 }}>
          <PickerView style={{ width: 1, height: 1 }} familyActivitySelectionId={SELECTION_ID}
            headerText="Applis à mettre en pause à l'heure de la prière" footerText="Le téléphone et les appels restent toujours disponibles."
            onSelectionChange={() => setCount(selectionCount())}
            onDismissRequest={() => setTimeout(() => { setOpen(false); setCount(selectionCount()); }, 800)} />
        </View>
      )}
    </Page>
  );
}

function Final({ who, onDone }: { who: string; onDone: () => void }) {
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => {
    haptic.success();
    loadTodayTimes().then((d) => {
      const n = nextPrayer(d.times);
      setNext(n ? `${n.fr} · ${d.times[n.key]}` : `Fajr · ${d.times.Fajr}`);
    }).catch(() => {});
  }, []);
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(pop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: ND }).start(); }, [pop]);
  return (
    <View style={{ flex: 1 }}>
      <Rays size={760} opacity={0.9} />
      <Animated.View style={{ alignSelf: 'center', marginTop: 90, width: 120, height: 120, borderRadius: 60, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pop }], shadowColor: C.goldBright, shadowOpacity: 0.7, shadowRadius: 40 }}>
        <LinearGradient colors={['#FFF4DC', C.goldBright, C.goldDeep]} start={{ x: 0.3, y: 0.2 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <Icon name="check" size={50} color={C.ink} stroke={2.4} />
      </Animated.View>
      <Rise delay={300} style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 24 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 42, lineHeight: 46, color: C.text, textAlign: 'center' }}>Bienvenue,{'\n'}<Text style={{ fontFamily: F.serifItalic, color: C.gold }}>{who}</Text>.</Text>
        <T style={{ fontSize: 14, lineHeight: 22, color: C.dim, textAlign: 'center', marginTop: 14 }}>Ton plan est actif. Qu'Allah te facilite et accepte tes prières.</T>
      </Rise>
      {next && (
        <Rise delay={600} style={st.nextCard}>
          <T style={{ fontSize: 11, letterSpacing: 2, color: C.gold }}>TA PROCHAINE PRIÈRE</T>
          <Text style={{ fontFamily: F.serif, fontSize: 34, color: C.text, marginTop: 4 }}>{next}</Text>
        </Rise>
      )}
      <View style={{ flex: 1 }} />
      <Rise delay={900}><Cta title="Entrer dans Noor Salat" onPress={onDone} /></Rise>
    </View>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  kicker: { fontSize: 11, letterSpacing: 2.6, color: C.gold, fontFamily: F.medium },
  title: { fontFamily: F.serif, fontSize: 36, lineHeight: 41, color: C.text, marginTop: 12 },
  input: { height: 62, borderRadius: 18, borderWidth: 1, backgroundColor: C.surface, color: C.text, fontFamily: F.regular, fontSize: 22, paddingHorizontal: 20 },
  box: { width: '30.5%', height: 96, borderRadius: 22, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', gap: 2 },
  boxOn: { borderColor: 'rgba(226,192,141,0.75)', backgroundColor: 'rgba(226,192,141,0.14)' },
  opt: { minHeight: 62, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  optOn: { borderColor: 'rgba(226,192,141,0.7)', backgroundColor: 'rgba(226,192,141,0.12)' },
  optIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  step: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  cta: { height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  planCard: { marginTop: 20, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(226,192,141,0.3)', backgroundColor: 'rgba(226,192,141,0.08)', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  planItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  allow: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: 'rgba(226,192,141,0.18)', alignItems: 'center', justifyContent: 'center' },
  nextCard: { marginTop: 34, marginHorizontal: 44, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, alignItems: 'center' },
});
