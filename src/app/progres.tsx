import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../components/Screen';
import { PageHeader } from '../components/PageHeader';
import { T } from '../components/Text';
import { Icon } from '../components/Icon';
import { IconButton, ND, Ring, Rise } from '../components/ui';
import { C, F } from '../lib/theme';
import { moisAnnee } from '../lib/format';
import { PRAYERS, currentPrayer, loadTodayTimes } from '../lib/prayer';
import { MILESTONES, Progress, loadProgress } from '../lib/progress';
import { Tip } from '../components/Guide';

const OP = [0.06, 0.2, 0.35, 0.5, 0.7, 1];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** « Ton chemin » : aujourd'hui, la régularité, les paliers, chaque prière et le mois. */
export default function Progres() {
  const [d, setD] = useState<Progress | null>(null);
  const [cur, setCur] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    loadProgress().then(setD).catch(() => {});
    loadTodayTimes().then((t) => setCur(currentPrayer(t.times)?.key ?? null)).catch(() => {});
  }, []));

  if (!d) return <Screen><PageHeader back={false} title="Ton chemin" subtitle={moisAnnee()} /></Screen>;

  const diff = d.noor - d.noorPrev;
  const next = MILESTONES.find((m) => m > d.streak);
  const maxP = Math.max(1, ...PRAYERS.map((p) => d.perPrayer[p.key]));
  const weekTotal = d.week.reduce((a, w) => a + w.count, 0);
  const sorted = [...PRAYERS].sort((a, b) => d.perPrayer[b.key] - d.perPrayer[a.key]);
  const has = sorted.some((p) => d.perPrayer[p.key] > 0);

  return (
    <Screen>
      <PageHeader back={false} title="Ton chemin" subtitle={moisAnnee()}
        right={<IconButton icon="qr" label="Mon QR de tapis" onPress={() => router.push('/profile')} />} />

      <Tip id="progres" title="Ton chemin">Chaque prière validée (scan ou versets) remplit cette page : ta journée, ta série de jours complets, ton Noor sur 7 jours et ton mois.</Tip>

      {/* Aujourd'hui */}
      <Rise delay={60} style={st.card}>
        <View style={st.between}>
          <T style={st.small}>Aujourd'hui</T>
          <T style={{ fontSize: 12, color: d.today.length === 5 ? C.goldBright : C.gold }}>{d.today.length === 5 ? 'Journée complète · MashaAllah' : `${d.today.length} / 5`}</T>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          {PRAYERS.map((p) => {
            const ok = d.today.includes(p.key);
            const now = !ok && cur === p.key;
            return (
              <View key={p.key} style={{ alignItems: 'center', gap: 7, flex: 1 }}>
                <View style={[st.dot, ok && st.dotOk, now && st.dotNow]}>
                  {ok ? <Icon name="check" size={18} color={C.ink} stroke={2.4} /> : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: now ? C.goldBright : 'rgba(255,255,255,0.18)' }} />}
                </View>
                <T style={{ fontSize: 11, color: ok ? C.goldBright : now ? C.text : C.dim }}>{p.fr}</T>
              </View>
            );
          })}
        </View>
        {d.dispenseDay !== null
          ? <T style={{ fontSize: 12, color: C.gold, marginTop: 14 }}>Pause en cours · jour {d.dispenseDay}. Ta série et ton Noor sont mis de côté, pas perdus.</T>
          : d.today.length < 5 && <T style={{ fontSize: 12, color: C.dim, marginTop: 14 }}>Scanne ton tapis après chaque prière pour la valider.</T>}
      </Rise>

      {/* Noor et séries */}
      <Rise delay={140} style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 22 }]}>
        <Ring size={118} stroke={6} value={d.noor / 100} duration={1600}>
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <T style={{ fontSize: 32, fontFamily: F.light }}>{d.noor}<T style={{ fontSize: 15, color: C.dim }}>%</T></T>
            <T style={{ fontSize: 11, color: C.dim }}>Noor · 7 jours</T>
          </View>
        </Ring>
        <View style={{ flex: 1, gap: 12 }}>
          <View>
            <T style={st.small}>Série en cours</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="flame" size={18} color={d.streak ? C.goldBright : C.faint} />
              <T style={st.big}>{d.streak} <T style={st.unit}>{d.streak > 1 ? 'jours' : 'jour'}</T></T>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: C.line }} />
          <T style={{ fontSize: 12, color: C.dim }}>Record : <T style={{ fontSize: 12 }}>{d.best} j</T></T>
          <T style={{ fontSize: 12, color: diff > 0 ? C.goldBright : C.dim }}>
            {d.noorPrev === 0 && d.noor === 0 ? 'Ta première semaine commence' : diff === 0 ? 'Stable par rapport à la semaine passée' : `${diff > 0 ? '▲ +' : '▼ '}${diff} pts vs semaine passée`}
          </T>
        </View>
      </Rise>

      {/* Paliers */}
      <Rise delay={220} style={st.card}>
        <View style={st.between}>
          <T style={st.small}>Paliers</T>
          <T style={{ fontSize: 12, color: C.gold }}>{next ? `Prochain : ${next} jours · encore ${next - d.streak}` : 'Tous atteints'}</T>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
          {MILESTONES.map((m) => {
            const won = d.best >= m;
            return (
              <View key={m} style={{ alignItems: 'center', gap: 6 }}>
                <View style={[st.badge, won && st.badgeOn]}>
                  <T style={{ fontSize: 15, fontFamily: F.medium, color: won ? C.ink : C.faint }}>{m}</T>
                </View>
                <T style={{ fontSize: 10, color: won ? C.goldBright : C.faint }}>jours</T>
              </View>
            );
          })}
        </View>
        <T style={{ fontSize: 12, color: C.dim, marginTop: 12 }}>Un palier se gagne avec les 5 prières validées, jour après jour.</T>
      </Rise>

      {/* Semaine */}
      <Rise delay={300} style={st.card}>
        <View style={st.between}><T style={st.small}>Cette semaine</T><T style={{ fontSize: 12, color: C.gold }}>{weekTotal} / 35</T></View>
        <View style={{ flexDirection: 'row', gap: 10, height: 76, marginTop: 14, alignItems: 'flex-end' }}>
          {d.week.map((w, i) => <Bar key={i} pct={w.count / 5} today={i === d.week.length - 1} delay={350 + i * 70} />)}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          {d.week.map((w, i) => <T key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: i === d.week.length - 1 ? C.gold : C.dim }}>{w.day}</T>)}
        </View>
      </Rise>

      {/* Par prière */}
      <Rise delay={380} style={st.card}>
        <View style={st.between}><T style={st.small}>Chaque prière · 30 jours</T><T style={st.small}>délai moyen</T></View>
        <View style={{ gap: 12, marginTop: 14 }}>
          {PRAYERS.map((p) => {
            const v = d.perPrayer[p.key];
            const late = d.delay[p.key];
            return (
              <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <T style={{ width: 62, fontSize: 13 }}>{p.fr}</T>
                <View style={st.track}><HBar pct={v / maxP} /></View>
                <T style={{ width: 34, fontSize: 12, color: C.dim, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{v}</T>
                <T style={{ width: 54, fontSize: 12, textAlign: 'right', color: late == null ? C.faint : late <= 15 ? C.goldBright : C.dim }}>{late == null ? '–' : `${late} min`}</T>
              </View>
            );
          })}
        </View>
        {has && (
          <T style={{ fontSize: 12, color: C.dim, marginTop: 14 }}>
            La plus tenue : <T style={{ fontSize: 12 }}>{sorted[0].fr}</T> · à renforcer : <T style={{ fontSize: 12, color: C.gold }}>{sorted[sorted.length - 1].fr}</T>
          </T>
        )}
      </Rise>

      {/* Mois */}
      <Rise delay={460} style={st.card}>
        <View style={st.between}><T style={st.small}>{moisAnnee()}</T><T style={st.small}>prières par jour</T></View>
        <View style={{ flexDirection: 'row', marginTop: 12, marginHorizontal: -3 }}>
          {WEEKDAYS.map((w, i) => <T key={i} style={{ width: `${100 / 7}%`, textAlign: 'center', fontSize: 10, color: C.faint }}>{w}</T>)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginHorizontal: -3 }}>
          {Array.from({ length: d.firstWeekday }).map((_, i) => <View key={'e' + i} style={{ width: `${100 / 7}%` }} />)}
          {d.month.map((c, i) => <Cell key={i} day={c.day} today={c.today} off={c.off} o={c.count == null || c.off ? 0.03 : OP[Math.min(5, c.count)]} full={!c.off && c.count === 5} delay={500 + i * 15} />)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
          <T style={{ fontSize: 11, color: C.dim }}>0</T>
          {[0.06, 0.35, 0.65, 1].map((o) => <View key={o} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: `rgba(226,192,141,${o})` }} />)}
          <T style={{ fontSize: 11, color: C.dim }}>5</T>
        </View>
      </Rise>

      {/* Chiffres */}
      <Rise delay={540} style={{ flexDirection: 'row', gap: 10 }}>
        <Stat label="Prières validées" value={d.total} sub="sur l'année" />
        <Stat label="Dhikr" value={d.dhikrToday} sub={`aujourd'hui · ${d.dhikrWeek} sur 7 jours`} />
      </Rise>
    </Screen>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <View style={[st.card, { flex: 1, paddingVertical: 16 }]}>
      <T style={st.small}>{label}</T>
      <T style={[st.big, { fontVariant: ['tabular-nums'] }]}>{value}</T>
      <T style={{ fontSize: 11, color: C.faint }}>{sub}</T>
    </View>
  );
}

function Bar({ pct, today, delay }: { pct: number; today: boolean; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 900, delay, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: ND }).start();
  }, [v, delay]);
  const h = Math.max(4, pct * 76);
  return (
    <View style={{ flex: 1, height: 76, justifyContent: 'flex-end', alignItems: 'center' }}>
      <Animated.View style={{ width: '100%', maxWidth: 26, height: h, borderRadius: 8,
        backgroundColor: today ? C.gold : pct >= 1 ? 'rgba(226,192,141,0.75)' : 'rgba(226,192,141,0.3)',
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [h / 2, 0] }) }, { scaleY: v }] }} />
    </View>
  );
}

function HBar({ pct }: { pct: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 900, delay: 450, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start();
  }, [v, pct]);
  return <Animated.View style={{ height: '100%', borderRadius: 4, backgroundColor: C.gold, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.max(2, pct * 100)}%`] }) }} />;
}

function Cell({ o, day, today, full, off, delay }: { o: number; day: number; today: boolean; full: boolean; off?: boolean; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 400, delay, useNativeDriver: ND }).start();
  }, [v, delay]);
  return (
    <View style={{ width: `${100 / 7}%`, padding: 3 }}>
      <Animated.View style={{ width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: `rgba(226,192,141,${o})`, alignItems: 'center', justifyContent: 'center',
        borderWidth: today ? 1.5 : off ? 1 : 0, borderColor: today ? C.goldBright : 'rgba(226,192,141,0.35)', borderStyle: off && !today ? 'dashed' : 'solid', opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
        <T style={{ fontSize: 10, color: full ? C.ink : today ? C.goldBright : C.faint }}>{day}</T>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 26, padding: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  small: { fontSize: 12, color: C.dim },
  big: { fontSize: 24, fontFamily: F.light, marginTop: 2 },
  unit: { fontSize: 13, color: C.dim },
  dot: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  dotOk: { backgroundColor: C.gold, borderColor: C.goldBright, shadowColor: C.goldBright, shadowOpacity: 0.6, shadowRadius: 10 },
  dotNow: { borderColor: C.goldBright, borderWidth: 1.5 },
  badge: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  badgeOn: { backgroundColor: C.gold, borderColor: C.goldBright },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
});
