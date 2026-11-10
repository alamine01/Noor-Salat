import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, View } from 'react-native';
import { router } from 'expo-router';
import type { DeviceActivitySelectionSheetViewProps } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import { T } from './Text';
import { Card, GhostButton, Row, StatusDot, Toggle } from './ui';
import { C } from '../lib/theme';
import { haptic } from '../lib/haptics';
import {
  ScreenTimeStatus, iosDiagnostic, saveSelection, savedSelection, loadSelection, alarmKitAuthorized, alarmKitAvailable, requestAlarmKit, requestScreenTime, screenTimeStatus, selectionCount,
} from '../lib/ios';
import { testBlockNow } from '../lib/blocker';

// Chargé seulement sur iPhone avec Temps d'écran (absent d'Expo Go, d'Android et du web).
let Picker: React.ComponentType<DeviceActivitySelectionSheetViewProps> | null | undefined;
function getPicker() {
  if (Picker === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Picker = (require('react-native-device-activity') as { DeviceActivitySelectionSheetView: typeof Picker }).DeviceActivitySelectionSheetView ?? null;
    } catch { Picker = null; }
  }
  return Picker;
}

/** Réglages iPhone : Temps d'écran, choix des applis, réveil AlarmKit. */
export function IosBlocking({ block, onToggleBlock, onChanged }: { block: boolean; onToggleBlock: (v: boolean) => void; onChanged: () => void }) {
  const [status, setStatus] = useState<ScreenTimeStatus>(screenTimeStatus());
  const [count, setCount] = useState(selectionCount());
  const [picker, setPicker] = useState(0); // 0 = jamais ouverte ; sinon numéro d'ouverture
  const [alarm, setAlarm] = useState<boolean | null>(null);
  const ak = alarmKitAvailable();

  const refresh = useCallback(() => { setStatus(screenTimeStatus()); setCount(selectionCount()); }, []);
  useEffect(() => {
    alarmKitAuthorized().then(setAlarm);
    loadSelection().then(refresh);
    // iOS confirme Temps d'écran avec un léger retard au lancement : on relit l'état quelques fois.
    const ids = [400, 1500, 3500].map((ms) => setTimeout(refresh, ms));
    return () => ids.forEach(clearTimeout);
  }, [refresh]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  if (status === 'unavailable') {
    return (
      <Card style={{ paddingVertical: 16 }}>
        <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>
          Le blocage des applis demande iOS 16 ou plus et l'autorisation Temps d'écran d'Apple. En attendant, tu reçois une notification forte à chaque prière.
        </T>
      </Card>
    );
  }

  const ready = status === 'approved' && count > 0;
  const PickerView = getPicker();
  return (
    <>
      <Card>
        <Row title="Bloquer les applis" sub="5 min après l'adhan, jusqu'au scan du tapis" right={<Toggle value={block} onChange={onToggleBlock} label="Bloquer les applis" />} />
        <Row title="Temps d'écran" sub={status === 'approved' ? 'Autorisé' : status === 'denied' ? 'Refusé : à réactiver dans Réglages › Temps d’écran' : 'Nécessaire pour bloquer les applis'}
          icon={<StatusDot ok={status === 'approved'} />}
          onPress={status === 'approved' ? undefined : async () => { if (status === 'denied') Linking.openSettings(); else { setStatus(await requestScreenTime()); onChanged(); } }}
          right={<T style={{ fontSize: 13, color: status === 'approved' ? C.dim : C.goldBright }}>{status === 'approved' ? 'Autorisé' : 'Autoriser'}</T>} />
        <Row title="Applis à bloquer" sub={count ? `${count} élément${count > 1 ? 's' : ''} choisi${count > 1 ? 's' : ''} (applis, catégories, sites)` : 'Choisis les applis qui te distraient'}
          icon={<StatusDot ok={count > 0} />}
          onPress={status === 'approved' ? () => { haptic.tap(); setPicker((n) => n + 1); } : undefined}
          right={<T style={{ fontSize: 13, color: C.goldBright }}>{count ? 'Modifier' : 'Choisir'}</T>} />
        <Row last title="Réveil Fajr (AlarmKit)" sub={ak ? (alarm ? 'Sonne même en silencieux, écran verrouillé' : 'Pour un vrai réveil, comme l’app Horloge') : 'Nécessite iOS 26 : sinon une notification forte'}
          icon={<StatusDot ok={!!alarm} />}
          onPress={ak && !alarm ? async () => { const ok = await requestAlarmKit(); setAlarm(ok); if (ok) onChanged(); } : undefined}
          right={ak ? <T style={{ fontSize: 13, color: alarm ? C.dim : C.goldBright }}>{alarm ? 'Autorisé' : 'Autoriser'}</T> : undefined} />
      </Card>
      <T onLongPress={() => {
        // Diagnostic caché (appui long) : ce que Temps d'écran a vraiment programmé et le dernier blocage.
        const d = iosDiagnostic();
        Alert.alert('Diagnostic', [`Autorisation : ${d.status}`, `Éléments choisis : ${d.selection}`, `Bouclier actif : ${d.shieldActive ? 'oui' : 'non'}`,
          `Dernier blocage : ${d.lastBlock}`, `Programmés (${d.activities}) :`, ...d.names].join('\n'));
      }} style={{ fontSize: 12, lineHeight: 18, color: C.dim, marginTop: -6, marginHorizontal: 4 }}>
        Sur iPhone, les applis bloquées affichent un écran Apple « C'est l'heure de prier ». Son bouton t'envoie une notification qui ouvre Noor Salat.
      </T>

      {picker > 0 && PickerView && (
        <View style={{ position: 'absolute', width: 1, height: 1 }}>
          <PickerView
            key={picker}
            style={{ width: 1, height: 1 }}
            familyActivitySelection={savedSelection()}
            headerText="Applis à mettre en pause à l'heure de la prière"
            footerText="Le téléphone et les appels restent toujours disponibles."
            // Chaque coche renvoie le choix complet : on l'enregistre tout de suite, sans attendre la fermeture.
            onSelectionChange={(e) => { saveSelection(e.nativeEvent.familyActivitySelection ?? null, e.nativeEvent); setCount(selectionCount()); }}
            // On NE retire PAS la vue à la fermeture : iOS peut renvoyer le choix un peu après,
            // et une vue retirée ne transmet plus rien. Elle est remplacée à la prochaine ouverture.
            onDismissRequest={() => { setTimeout(() => { refresh(); onChanged(); }, 1500); }}
          />
        </View>
      )}
    </>
  );
}
