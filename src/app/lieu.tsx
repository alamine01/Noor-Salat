import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { PageHeader } from '../components/PageHeader';
import { T } from '../components/Text';
import { Icon } from '../components/Icon';
import { Card, Row, goBack } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import { getPlaceSetting, loadTodayTimes, setPlaceSetting } from '../lib/prayer';
import { COUNTRIES_SORTED, Country, METHOD_NAMES, findPlace, norm } from '../lib/places';
import { scheduleDay } from '../lib/blocker';

/** Réglages › Lieu : « Ma position », ou un pays puis une ville. Le pays fixe la méthode de calcul. */
export default function Lieu() {
  const [current, setCurrent] = useState('gps');
  const [country, setCountry] = useState<Country | null>(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getPlaceSetting().then((v) => {
      setCurrent(v);
      // On ouvre directement le pays déjà choisi.
      const p = findPlace(v);
      if (p) setCountry(p.country);
    });
  }, []);

  async function choose(v: string) {
    haptic.tap();
    setBusy(v);
    setCurrent(v);
    await setPlaceSetting(v);
    const d = await loadTodayTimes().catch(() => null);
    if (d) await scheduleDay(d.times).catch(() => {});
    setBusy(null);
    haptic.success();
    goBack();
  }

  const query = norm(q);
  const countries = useMemo(
    () => (query ? COUNTRIES_SORTED.filter((c) => norm(c.name).includes(query)) : COUNTRIES_SORTED),
    [query],
  );
  // En recherche, on montre aussi les villes qui correspondent, tous pays confondus.
  const cityHits = useMemo(() => {
    if (!query) return [];
    const out: { c: Country; key: string; name: string }[] = [];
    for (const c of COUNTRIES_SORTED) for (const city of c.cities) if (norm(city.name).includes(query)) out.push({ c, key: city.key, name: city.name });
    return out.slice(0, 20);
  }, [query]);

  const check = (v: string) =>
    busy === v ? <ActivityIndicator color={C.gold} /> : current === v ? <Icon name="check" size={18} color={C.goldBright} /> : null;

  return (
    <Screen nav={false}>
      <PageHeader title="Lieu" subtitle="Heures de prière et Qibla" onBack={country && !query ? () => setCountry(null) : undefined} />

      <Card>
        <Row last title="◎  Ma position" sub="Le pays et sa méthode de calcul sont détectés tout seuls" onPress={() => choose('gps')} right={check('gps')} />
      </Card>

      <View style={st.search}>
        <Icon name="search" size={16} color={C.faint} />
        <TextInput value={q} onChangeText={setQ} placeholder="Chercher un pays ou une ville" placeholderTextColor="#6B7183"
          autoCorrect={false} returnKeyType="search" style={st.input} accessibilityLabel="Chercher un pays ou une ville" />
        {!!q && <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Effacer"><Icon name="x" size={14} color={C.faint} /></Pressable>}
      </View>

      {query ? (
        <>
          {cityHits.length > 0 && (
            <Card>
              {cityHits.map((h, i) => {
                const v = `${h.c.code}:${h.key}`;
                return <Row key={v} last={i === cityHits.length - 1} title={h.name} sub={`${h.c.flag}  ${h.c.name}`} onPress={() => choose(v)} right={check(v)} />;
              })}
            </Card>
          )}
          {countries.length > 0 && (
            <Card>
              {countries.map((c, i) => (
                <Row key={c.code} last={i === countries.length - 1} title={`${c.flag}  ${c.name}`} sub={`${c.cities.length} ville${c.cities.length > 1 ? 's' : ''}`}
                  onPress={() => { haptic.tap(); setQ(''); setCountry(c); }} right={<Icon name="chevron" size={16} color={C.faint} />} />
              ))}
            </Card>
          )}
          {!cityHits.length && !countries.length && (
            <T style={{ textAlign: 'center', fontSize: 13, color: C.dim }}>Rien trouvé. Choisis « Ma position » : elle marche partout dans le monde.</T>
          )}
        </>
      ) : country ? (
        <>
          <Pressable onPress={() => { haptic.tap(); setCountry(null); }} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 4 }}>
            <Icon name="back" size={14} color={C.gold} />
            <T style={{ fontSize: 13, color: C.gold }}>Tous les pays</T>
          </Pressable>
          <View style={{ marginHorizontal: 4, gap: 2 }}>
            <Text style={{ fontFamily: F.serif, fontSize: 28, color: C.text }}>{country.flag}  {country.name}</Text>
            <T style={{ fontSize: 12, color: C.dim }}>{METHOD_NAMES[country.method]} · Asr {country.school ? 'hanafite' : 'standard'}</T>
          </View>
          <Card>
            {country.cities.map((city, i) => {
              const v = `${country.code}:${city.key}`;
              return <Row key={v} last={i === country.cities.length - 1} title={city.name} onPress={() => choose(v)} right={check(v)} />;
            })}
          </Card>
          <T style={{ fontSize: 12, color: C.dim, marginHorizontal: 4 }}>Ta ville n'y est pas ? Choisis la plus proche, ou « Ma position ».</T>
        </>
      ) : (
        <Card>
          {COUNTRIES_SORTED.map((c, i) => (
            <Row key={c.code} last={i === COUNTRIES_SORTED.length - 1} title={`${c.flag}  ${c.name}`}
              sub={findPlace(current)?.country.code === c.code ? `Choisi · ${findPlace(current)!.city.name}` : `${c.cities.length} ville${c.cities.length > 1 ? 's' : ''}`}
              onPress={() => { haptic.tap(); setCountry(c); }} right={<Icon name="chevron" size={16} color={C.faint} />} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  search: { height: 48, borderRadius: 16, borderWidth: 1, borderColor: C.line2, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: C.text, fontFamily: F.regular, fontSize: 15, paddingVertical: 0 },
});
