import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_200ExtraLight, Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { C } from '../lib/theme';
import { Splash } from '../components/Splash';
import { NoorBlocker } from '../../modules/noor-blocker';
import { setupNotifications } from '../lib/blocker';
import { SHIELD_NOTIFS, loadSelection } from '../lib/ios';
import { applyUpdateNow } from '../components/UpdateInfo';
import { Onboarding, onboardingDone } from '../components/Onboarding';

SplashScreen.preventAutoHideAsync().catch(() => {});
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

export default function Layout() {
  const [loaded] = useFonts({
    Inter_200ExtraLight, Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic, Amiri_400Regular,
  });
  // Sur le web, ?nosplash saute l'ouverture (captures d'écran).
  const [intro, setIntro] = useState(() => !(Platform.OS === 'web' && typeof location !== 'undefined' && location.search.includes('nosplash')));
  // Prière, réveil ou Focus en cours : l'ouverture se passe toute seule, sans appui long.
  const [auto] = useState(() => !!NoorBlocker?.pendingKind());
  // Premier lancement : l'onboarding passe avant l'appli (et avant toute demande d'autorisation).
  const [obDone, setObDone] = useState<boolean | null>(null);
  useEffect(() => { onboardingDone().then(setObDone).catch(() => setObDone(true)); }, []);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // Les autorisations ne sont demandées qu'après l'onboarding (qui les explique d'abord).
  useEffect(() => { if (obDone) setupNotifications(); }, [obDone]);
  // iPhone : recharge le choix d'applis gardé en secours avant toute programmation du blocage.
  useEffect(() => { loadSelection().catch(() => {}); }, []);
  // Mise à jour publiée ? On l'applique dès ce lancement, sans attendre le suivant.
  useEffect(() => { applyUpdateNow(); }, []);
  // Les notifications « Ouvrir Noor Salat » de l'écran Apple ont servi : on les retire dès que l'appli est ouverte.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const clear = () => SHIELD_NOTIFS.forEach((id) => Notifications.dismissNotificationAsync(id).catch(() => {}));
    clear();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && clear());
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      // Les notifications envoyées par l'écran de blocage iPhone mettent l'adresse dans userInfo.
      const c = r.notification.request.content as { data?: Record<string, unknown> };
      const url = (c.data?.url ?? (c.data?.body as Record<string, unknown> | undefined)?.url) as string | undefined;
      setIntro(false);
      if (url?.includes('fajr-ring')) router.push('/fajr-ring');
      else if (url?.includes('block')) router.push('/block');
      else if (url?.includes('taqwa')) router.push('/taqwa');
      else if (url?.includes('focus')) router.push('/focus');
    });
    return () => sub.remove();
  }, []);

  const afterIntro = useCallback(() => {
    setIntro(false);
    // Si le gardien Android est actif (prière ou Fajr), on rouvre le bon écran.
    const kind = NoorBlocker?.pendingKind();
    if (kind === 'fajr') router.push('/fajr-ring');
    else if (kind === 'block') router.push('/block');
    else if (kind === 'focus') router.push('/focus');
  }, []);

  if (!loaded || obDone === null) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!obDone) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar style="light" />
        <Onboarding onDone={() => setObDone(true)} />
        {intro && <Splash onDone={() => setIntro(false)} auto={false} />}
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'fade' }}>
        <Stack.Screen name="block" options={{ gestureEnabled: false }} />
        <Stack.Screen name="fajr-ring" options={{ gestureEnabled: false }} />
        <Stack.Screen name="versets" options={{ gestureEnabled: false }} />
      </Stack>
      {intro && <Splash onDone={afterIntro} auto={auto} />}
    </View>
  );
}
