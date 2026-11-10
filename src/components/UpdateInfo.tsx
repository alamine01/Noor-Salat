import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { T } from './Text';
import { Card, GhostButton } from './ui';
import { C } from '../lib/theme';

/** Réglages : quelle version tourne vraiment (build d'origine ou mise à jour OTA), et bouton pour mettre à jour tout de suite. */
export function UpdateInfo() {
  const [busy, setBusy] = useState(false);
  if (Platform.OS === 'web') return null;

  const ota = !Updates.isEmbeddedLaunch && !!Updates.updateId;
  const date = Updates.createdAt ? Updates.createdAt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '?';
  const lines = [
    ota ? `Mise à jour du ${date} · ${Updates.updateId!.slice(0, 8)}` : 'Version d’origine (aucune mise à jour appliquée)',
    `Canal : ${Updates.channel ?? '?'} · runtime ${String(Updates.runtimeVersion ?? '?').slice(0, 7)}`,
  ];

  async function check() {
    setBusy(true);
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) { Alert.alert('Mise à jour', 'Tu as déjà la dernière version.'); return; }
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync(); // redémarre l'appli sur la nouvelle version
    } catch (e) {
      Alert.alert('Mise à jour', 'Impossible de vérifier : ' + String((e as Error)?.message ?? e));
    } finally { setBusy(false); }
  }

  return (
    <Card style={{ paddingVertical: 14, gap: 4 }}>
      {lines.map((l) => <T key={l} selectable style={{ fontSize: 11, color: C.dim }}>{l}</T>)}
      <GhostButton title={busy ? 'Vérification…' : 'Chercher une mise à jour'} color={C.goldBright} style={{ marginTop: 8 }} onPress={busy ? () => {} : check} />
    </Card>
  );
}

/** Au lancement : si une mise à jour existe, on la télécharge et on redémarre dessus tout de suite (une fois). */
let autoChecked = false;
export async function applyUpdateNow() {
  if (autoChecked || Platform.OS === 'web' || __DEV__ || !Updates.isEnabled) return;
  autoChecked = true;
  try {
    const r = await Updates.checkForUpdateAsync();
    if (!r.isAvailable) return;
    const f = await Updates.fetchUpdateAsync();
    if (f.isNew) await Updates.reloadAsync();
  } catch {}
}
