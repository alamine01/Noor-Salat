import { ReactNode } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../lib/theme';
import { Backdrop } from './ui';
import { NavBar, NAV_SPACE } from './NavBar';

/** Écran standard : fond nuit, contenu qui défile, barre du bas en option. */
export function Screen({ children, nav = true, stars = false, scroll = true, gap = 18, style }: {
  children: ReactNode; nav?: boolean; stars?: boolean; scroll?: boolean; gap?: number; style?: StyleProp<ViewStyle>; variant?: string;
}) {
  // Android à 3 boutons / iPhone : la barre système du bas s'ajoute à la barre Noor (et au bouton de scan qui dépasse).
  const { bottom } = useSafeAreaInsets();
  const padBottom = (nav ? NAV_SPACE + 36 : 32) + bottom;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop stars={stars} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView contentContainerStyle={[{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: padBottom, gap }, style]} showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: padBottom, gap }, style]}>{children}</View>
        )}
      </SafeAreaView>
      {nav && <NavBar />}
    </View>
  );
}
