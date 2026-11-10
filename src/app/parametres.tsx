import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../components/Screen';
import { PageHeader, Section } from '../components/PageHeader';
import { T } from '../components/Text';
import { Icon } from '../components/Icon';
import { Card, Chip, GhostButton, Row, Segmented, StatusDot, Toggle } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import {
  ADJUST_LIMIT, Adjustments, DayTimes, NO_ADJUST, PRAYERS, PlaceSetting, PrayerKey,
  getAdjustments, getPlaceSetting, loadTodayTimes, setAdjustments, setPlaceSetting,
} from '../lib/prayer';
import { FOCUS_LEVELS, FocusLevel, FocusLevelKey, getFocusLevel, getFocusSession, setFocusLevel, AdhanKey, FajrSettings, NotifStyle, getAdhan, getBlockEnabled, getFajr, getNotifStyle, setAdhan, setBlockEnabled, setNotifStyle } from '../lib/store';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { ADHANS } from '../lib/alarm';
import { canReallyBlock, permissionsStatus, scheduleDay, testBlockNow } from '../lib/blocker';
import { NoorBlocker } from '../../modules/noor-blocker';
import { IosBlocking } from '../components/IosBlocking';
import { findPlace } from '../lib/places';
import { UpdateInfo } from '../components/UpdateInfo';

const AUDIO: Record<FajrSettings['audio'], string> = { khayr: 'As-salātu khayrun mina-n-nawm', adhan_fajr: 'Adhan du Fajr', systeme: 'Sonnerie du téléphone' };

/** Réglages : ville, ajustements, méthode, blocage et autorisations. Chaque changement reprogramme les rappels. */
export default function Parametres() {
  const [place, setPlace] = useState<PlaceSetting>('gps');
  const [level, setLevel] = useState<FocusLevel>(FOCUS_LEVELS.moyen);
  const [focusOn, setFocusOn] = useState(false);
  const placeRef = useRef<string | null>(null); // lieu au dernier affichage (pour recharger après /lieu)
  const [adj, setAdj] = useState<Adjustments>(NO_ADJUST);
  const [day, setDay] = useState<DayTimes | null>(null);
  const [busy, setBusy] = useState(false);
  const [block, setBlock] = useState(true);
  const [perm, setPerm] = useState(permissionsStatus());
  const [fajr, setFajrS] = useState<FajrSettings | null>(null);
  const [style, setStyle] = useState<NotifStyle>('complet');
  const [adhan, setAdhanS] = useState<AdhanKey>('beautiful');
  const [listening, setListening] = useState(false);
  const player = useRef<AudioPlayer | null>(null);
  const run = useRef(0);

  const reload = useCallback(async () => {
    const id = ++run.current;
    setBusy(true);
    const d = await loadTodayTimes();
    if (id !== run.current) return; // une modification plus récente est en cours
    setDay(d);
    await scheduleDay(d.times).catch(() => {});
    setBusy(false);
  }, []);

  useEffect(() => {
    (async () => {
      setPlace(await getPlaceSetting());
      setAdj(await getAdjustments());
      setBlock(await getBlockEnabled());
      setStyle(await getNotifStyle());
      setLevel(await getFocusLevel());
      setAdhanS(await getAdhan());
      reload();
    })();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setPerm(permissionsStatus()));
    return () => sub.remove();
  }, [reload]);
  useFocusEffect(useCallback(() => { setPerm(permissionsStatus()); getFajr().then(setFajrS); getFocusSession().then((f) => setFocusOn(!!f && f.endAt > Date.now())); getPlaceSetting().then((v) => { if (placeRef.current !== null && placeRef.current !== v) reload(); placeRef.current = v; setPlace(v); }); }, [reload]));

  async function choosePlace(p: PlaceSetting) {
    setPlace(p);
    await setPlaceSetting(p);
    reload();
  }
  async function bump(k: PrayerKey, delta: number) {
    const v = Math.max(-ADJUST_LIMIT, Math.min(ADJUST_LIMIT, adj[k] + delta));
    if (v === adj[k]) return;
    haptic.tap();
    const next = { ...adj, [k]: v };
    setAdj(next);
    await setAdjustments(next);
    reload();
  }
  async function reset() {
    haptic.light();
    setAdj(NO_ADJUST);
    await setAdjustments(NO_ADJUST);
    reload();
  }
  function stopListen() {
    try { player.current?.pause(); player.current?.remove(); } catch {}
    player.current = null;
    setListening(false);
  }
  useEffect(() => stopListen, []);
  function listen(k: AdhanKey) {
    stopListen();
    if (k === 'none') return;
    try { player.current = createAudioPlayer(ADHANS[k]); player.current.play(); setListening(true); } catch {}
  }
  async function chooseAdhan(v: AdhanKey) {
    setAdhanS(v);
    await setAdhan(v);
    listen(v);
    reload();
  }
  async function chooseStyle(v: NotifStyle) {
    setStyle(v);
    await setNotifStyle(v);
    reload();
  }
  async function toggleBlock(v: boolean) {
    setBlock(v);
    await setBlockEnabled(v);
    reload();
  }

  const perms = [
    { ok: perm.usage, name: "Statistiques d'usage", why: 'Savoir quelle appli est ouverte', open: () => NoorBlocker?.openUsageAccessSettings() },
    { ok: perm.overlay, name: 'Affichage par-dessus', why: "Montrer l'écran de prière", open: () => NoorBlocker?.openOverlaySettings() },
    { ok: perm.exact, name: 'Alarmes exactes', why: "Bloquer et réveiller à l'heure", open: () => NoorBlocker?.openExactAlarmSettings() },
    { ok: perm.battery, name: "Ignorer l'économie de batterie", why: 'Ne pas être coupé en arrière-plan', open: () => NoorBlocker?.openBatterySettings?.() },
  ];

  return (
    <Screen nav={false}>
      <PageHeader title="Réglages" />

      <Card>
        <Row last title="Mon compte et sauvegarde" sub="Retrouver ta série sur un nouveau téléphone, classement" onPress={() => router.push('/compte')}
          icon={<View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(226,192,141,0.14)', alignItems: 'center', justifyContent: 'center' }}><Icon name="shieldCheck" size={16} color={C.gold} /></View>}
          right={<Icon name="chevron" size={16} color={C.faint} />} />
      </Card>

      <Section>Lieu</Section>
      <Card>
        <Row last title={place === 'gps' ? '◎  Ma position' : (() => { const p = findPlace(place); return p ? `${p.country.flag}  ${p.city.name}, ${p.country.name}` : 'Ma position'; })()}
          sub={busy ? 'Mise à jour des horaires et des rappels…' : day ? `Fajr ${day.times.Fajr} · Maghrib ${day.times.Maghrib} aujourd'hui · ${day.city}${day.source === 'cache' ? ' · hors-ligne' : day.source === 'exemple' ? ' · exemple' : ''}` : ' '}
          onPress={() => router.push('/lieu')} right={<T style={{ fontSize: 13, color: C.goldBright }}>Changer</T>} />
      </Card>

      <Section>Ajustement manuel</Section>
      <Card>
        {PRAYERS.map((p, i) => (
          <View key={p.key} style={[st.adj, i < PRAYERS.length - 1 && st.line]}>
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 14 }}>{p.fr}</T>
              <T style={{ fontSize: 11.5, color: C.dim, fontVariant: ['tabular-nums'] }}>{day ? day.times[p.key] : '--:--'}</T>
            </View>
            <Step icon="minus" label={`${p.fr} une minute plus tôt`} disabled={adj[p.key] <= -ADJUST_LIMIT} onPress={() => bump(p.key, -1)} />
            <T style={{ width: 58, textAlign: 'center', fontSize: 15, color: adj[p.key] ? C.goldBright : C.dim, fontVariant: ['tabular-nums'] }}>{adj[p.key] > 0 ? '+' : ''}{adj[p.key]} min</T>
            <Step icon="plus" label={`${p.fr} une minute plus tard`} disabled={adj[p.key] >= ADJUST_LIMIT} onPress={() => bump(p.key, 1)} />
          </View>
        ))}
      </Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -8, marginHorizontal: 4 }}>
        <T style={{ fontSize: 12, color: C.dim }}>De −{ADJUST_LIMIT} à +{ADJUST_LIMIT} min, comme ta mosquée</T>
        <Pressable onPress={reset} hitSlop={10} accessibilityRole="button"><T style={{ fontSize: 13, color: C.gold, fontFamily: F.medium }}>Remettre à 0</T></Pressable>
      </View>

      <Section>Méthode de calcul</Section>
      <Card><Row last title={(day?.methodLabel ?? 'Ligue islamique mondiale').split(' · ')[0]} sub={`${(day?.methodLabel ?? '').split(' · ')[1] ?? 'Asr standard'} · choisie selon le pays`} /></Card>

      <Section>Session Focus</Section>
      <Card style={{ paddingVertical: 16, gap: 12 }}>
        <T style={{ fontSize: 13, color: C.soft }}>Difficulté pour prendre une pause ou arrêter une session</T>
        <View pointerEvents={focusOn ? 'none' : 'auto'} style={{ opacity: focusOn ? 0.45 : 1 }}>
          <Segmented items={['Facile', 'Moyen', 'Difficile']} value={['facile', 'moyen', 'difficile'].indexOf(level.key)}
            onChange={(i) => { const k = (['facile', 'moyen', 'difficile'] as FocusLevelKey[])[i]; haptic.tap(); setLevel(FOCUS_LEVELS[k]); setFocusLevel(k); }} />
        </View>
        {focusOn && <T style={{ fontSize: 12, color: C.warn }}>Verrouillé pendant une session Focus (pause comprise). Tu pourras le changer à la fin.</T>}
        <T style={{ fontSize: 12, lineHeight: 18, color: C.dim }}>
          {level.key === 'facile' ? 'Lire 3 versets.' : level.key === 'moyen' ? 'Lire 5 versets, puis patienter 30 secondes.' : 'Lire 10 versets, plus longuement, puis patienter 1 minute.'}
        </T>
      </Card>

      <Section>Rappels de prière</Section>
      <Card style={{ paddingVertical: 16, gap: 12 }}>
        <Segmented items={['Complet', 'Essentiel']} value={style === 'complet' ? 0 : 1} onChange={(i) => chooseStyle(i === 0 ? 'complet' : 'essentiel')} />
        <T style={{ fontSize: 12, lineHeight: 18, color: C.dim }}>
          {style === 'complet'
            ? '10 min avant, à l\u2019heure, puis un rappel à +15 min et à +30 min. Les deux derniers sont annulés dès que tu valides ta prière.'
            : 'Une seule notification, à l\u2019heure de chaque prière.'}
        </T>
        <T style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Son à l’heure de la prière</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {([['beautiful', 'Adhan'], ['none', 'Son simple']] as [AdhanKey, string][]).map(([k, l]) => (
            <Chip key={k} label={l} on={adhan === k} onPress={() => chooseAdhan(k)} style={{ flexGrow: 1 }} />
          ))}
        </View>
        {listening && <T onPress={stopListen} style={{ fontSize: 13, color: C.gold, textAlign: 'center' }}>Arrêter l’écoute</T>}
        <T style={{ fontSize: 11, lineHeight: 16, color: C.faint }}>{Platform.OS === 'ios' ? 'Sur iPhone, la notification joue les 30 premières secondes (règle d’Apple). ' : ''}Le Fajr a son propre réveil.</T>
      </Card>

      <Section>Blocage à l'heure de la prière</Section>
      {canReallyBlock ? (
        <>
          <Card>
            <Row title="Bloquer les applis" sub="5 min après l'adhan, jusqu'au scan du tapis" right={<Toggle value={block} onChange={toggleBlock} label="Bloquer les applis" />} />
            {perms.map((p, i) => (
              <Row key={p.name} last={i === perms.length - 1} title={p.name} sub={p.why} icon={<StatusDot ok={p.ok} />}
                onPress={p.ok ? undefined : p.open}
                right={<T style={{ fontSize: 13, color: p.ok ? C.dim : C.goldBright }}>{p.ok ? 'Autorisé' : 'Autoriser'}</T>} />
            ))}
          </Card>
          <T style={{ fontSize: 12, lineHeight: 18, color: C.dim, marginTop: -6, marginHorizontal: 4 }}>Tecno, Infinix, Xiaomi, Samsung : sans la dernière ligne, le téléphone peut couper Noor Salat en arrière-plan.</T>
        </>
      ) : Platform.OS === 'ios' ? (
        <IosBlocking block={block} onToggleBlock={toggleBlock} onChanged={reload} />
      ) : (
        <Card style={{ paddingVertical: 16 }}>
          <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>
            Sur le web, le blocage et les alarmes sont désactivés. Installe l'appli sur ton téléphone pour les tester.
          </T>
          {Platform.OS === 'web' && <GhostButton title="Voir l'écran de blocage" style={{ marginTop: 12, marginBottom: 4 }} onPress={() => router.push('/block')} />}
        </Card>
      )}

      <Section>Plus</Section>
      <Card>
        <Row title="Réveil Fajr" sub={fajr ? `${fajr.enabled ? 'Activé' : 'Désactivé'} · ${AUDIO[fajr.audio]} · squats ${fajr.squats ? 'activés' : 'désactivés'}` : ' '} onPress={() => router.push('/fajr')} right={<Icon name="chevron" size={16} color={C.faint} />} />
        <Row title="Noor Filter" sub={Platform.OS === 'android' ? "Disponible sur iPhone pour l'instant" : "Bloque les sites adultes"} onPress={() => router.push('/taqwa')} right={<Icon name="chevron" size={16} color={C.faint} />} />
        <Row last title="Mon QR de tapis" sub="L'afficher ou l'imprimer" onPress={() => router.push('/profile')} right={<Icon name="chevron" size={16} color={C.faint} />} />
      </Card>
      <Section>Crédits des enregistrements</Section>
      <Card style={{ paddingVertical: 14, gap: 6 }}>
        <T selectable style={{ fontSize: 11, lineHeight: 17, color: C.dim }}>
          Adhan : « Beautiful adhan », Adam-synagda, Wikimedia Commons, domaine public (CC0).{'\n'}
          Adhan du Fajr et « As-salātu khayrun mina-n-nawm » : Besim Azemi, Centre islamique de Malmö (2012), Wikimedia Commons, CC BY 3.0 (adapté : extraits, volume).
        </T>
      </Card>
      <UpdateInfo />
      <T style={{ textAlign: 'center', fontSize: 11, color: C.faint }}>Noor Salat · 100 % gratuit · ta position et tes photos ne quittent jamais ton téléphone</T>
    </Screen>
  );
}

function Step({ icon, label, disabled, onPress }: { icon: 'minus' | 'plus'; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}
      style={({ pressed }) => [st.step, { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 }]}>
      <Icon name={icon} size={16} color={C.text} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  adj: { height: 58, flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  step: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
});
