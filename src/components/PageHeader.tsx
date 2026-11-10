import { ReactNode } from 'react';
import { View } from 'react-native';
import { C } from '../lib/theme';
import { Serif, T } from './Text';
import { IconButton, Rise, goBack } from './ui';

/** En-tête des pages : bouton retour rond, petite ligne grise, grand titre serif. */
export function PageHeader({ title, subtitle, right, back = true, onBack }: {
  title: string; subtitle?: string; right?: ReactNode; back?: boolean; onBack?: () => void;
}) {
  return (
    <Rise>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 }}>
        {back && <IconButton icon="back" label="Retour" onPress={onBack ?? goBack} />}
        <View style={{ flex: 1 }}>
          {subtitle ? <T numberOfLines={2} style={{ fontSize: 12, color: C.dim }}>{subtitle}</T> : null}
          <Serif numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize: 32, lineHeight: 36 }}>{title}</Serif>
        </View>
        {right}
      </View>
    </Rise>
  );
}

/** Petit titre de section. */
export function Section({ children }: { children: string }) {
  return <T style={{ fontSize: 11, letterSpacing: 2.2, color: C.gold, fontFamily: 'Inter_500Medium', marginHorizontal: 4, marginBottom: -6, textTransform: 'uppercase' }}>{children}</T>;
}
