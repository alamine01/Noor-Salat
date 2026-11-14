import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AndroidApp, NoorBlocker } from '../../modules/noor-blocker';
import { T } from './Text';
import { Icon } from './Icon';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';

/** Applis souvent choisies : réseaux sociaux, vidéos courtes, jeux populaires. Pré-cochées si installées. */
const SUGGESTED = new Set([
  'com.instagram.android', 'com.zhiliaoapp.musically', 'com.ss.android.ugc.trill', 'com.facebook.katana', 'com.facebook.lite',
  'com.snapchat.android', 'com.twitter.android', 'com.google.android.youtube', 'com.netflix.mediaclient', 'com.pinterest',
  'com.reddit.frontpage', 'com.instagram.barcelona', 'com.facebook.orca', 'com.supercell.clashofclans', 'com.king.candycrushsaga',
  'com.dts.freefireth', 'com.tencent.ig', 'com.activision.callofduty.shooter', 'com.kwai.video', 'com.likee.video',
]);

/** Le choix d'applis est-il disponible dans cette version installée ? (ajouté au build du 12 novembre) */
export const androidPickerAvailable = () => !!NoorBlocker?.getLaunchableApps;

export const blockedAppsCount = () => {
  try { return NoorBlocker?.getBlockedApps?.().length ?? 0; } catch { return 0; }
};

/** Choix des applis à mettre en pause (Android). Rien de coché = toutes les applis (mode strict). */
export function AndroidAppPicker({ visible, onClose }: { visible: boolean; onClose: (count: number) => void }) {
  const [apps, setApps] = useState<AndroidApp[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!visible) return;
    setQ('');
    let saved: string[] = [];
    try { saved = NoorBlocker?.getBlockedApps?.() ?? []; } catch {}
    NoorBlocker?.getLaunchableApps?.()
      .then((list) => {
        setApps(list);
        // Premier choix : on pré-coche les réseaux sociaux et vidéos installés.
        setSel(new Set(saved.length ? saved : list.filter((a) => SUGGESTED.has(a.package)).map((a) => a.package)));
      })
      .catch(() => setApps([]));
  }, [visible]);

  const shown = useMemo(() => {
    if (!apps) return [];
    const n = q.trim().toLowerCase();
    const list = n ? apps.filter((a) => a.label.toLowerCase().includes(n)) : apps;
    // Applis cochées d'abord, puis l'ordre alphabétique.
    return [...list].sort((a, b) => Number(sel.has(b.package)) - Number(sel.has(a.package)) || a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, q]);

  const toggle = (p: string) => {
    haptic.tap();
    const s = new Set(sel);
    if (s.has(p)) s.delete(p); else s.add(p);
    setSel(s);
  };
  const save = () => {
    haptic.success();
    try { NoorBlocker?.setBlockedApps?.([...sel]); } catch {}
    onClose(sel.size);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onClose(blockedAppsCount())}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0D15' }}>
        <View style={st.head}>
          <Pressable onPress={() => onClose(blockedAppsCount())} accessibilityRole="button" accessibilityLabel="Annuler" style={st.round}><Icon name="close" size={18} color={C.text} /></Pressable>
          <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.text }}>Applis à mettre en pause</Text>
          <Pressable onPress={save} accessibilityRole="button" accessibilityLabel="Valider" style={[st.round, { backgroundColor: C.gold }]}><Icon name="check" size={18} color={C.ink} stroke={2.6} /></Pressable>
        </View>
        <T style={{ fontSize: 13, lineHeight: 19, color: C.dim, paddingHorizontal: 20, marginBottom: 12 }}>
          Coche les applis qui te distraient. Les autres restent libres, ainsi que le téléphone et les appels d’urgence.
        </T>
        <View style={st.search}>
          <Icon name="search" size={16} color={C.faint} />
          <TextInput value={q} onChangeText={setQ} placeholder="Rechercher une appli" placeholderTextColor="#6B7183" style={{ flex: 1, color: C.text, fontFamily: F.regular, fontSize: 15 }} accessibilityLabel="Rechercher une appli" />
        </View>
        {!apps ? (
          <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={shown}
            keyExtractor={(a) => a.package}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
            initialNumToRender={20}
            renderItem={({ item }) => {
              const on = sel.has(item.package);
              return (
                <Pressable onPress={() => toggle(item.package)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={[st.row, on && st.rowOn]}>
                  {item.icon ? <Image source={{ uri: item.icon }} style={{ width: 36, height: 36, borderRadius: 9 }} /> : <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: C.surface2 }} />}
                  <T style={{ flex: 1, fontSize: 15 }} numberOfLines={1}>{item.label}</T>
                  <View style={[st.check, on && { backgroundColor: C.gold, borderColor: C.gold }]}>{on && <Icon name="check" size={13} color={C.ink} stroke={3} />}</View>
                </Pressable>
              );
            }}
          />
        )}
        <View style={st.foot}>
          <Pressable onPress={save} accessibilityRole="button" style={st.cta}>
            <Text style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>
              {sel.size ? `Mettre en pause ${sel.size} appli${sel.size > 1 ? 's' : ''}` : 'Tout mettre en pause (mode strict)'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, height: 46, borderRadius: 14, backgroundColor: C.surface2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, marginBottom: 6, borderWidth: 1, borderColor: 'transparent' },
  rowOn: { backgroundColor: 'rgba(226,192,141,0.10)', borderColor: 'rgba(226,192,141,0.35)' },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: 'rgba(11,13,21,0.96)' },
  cta: { height: 56, borderRadius: 18, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
});
