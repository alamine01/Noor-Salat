import { Text, TextProps } from 'react-native';
import { C, F } from '../lib/theme';

/** Texte courant (Inter). */
export const T = ({ style, ...p }: TextProps) => <Text {...p} style={[{ fontFamily: F.regular, color: C.text, fontSize: 15 }, style]} />;

/** Titre serif (Instrument Serif). */
export const Serif = ({ style, ...p }: TextProps) => <Text {...p} style={[{ fontFamily: F.serif, color: C.text, fontSize: 32 }, style]} />;

/** Texte arabe (Amiri). */
export const Ar = ({ style, ...p }: TextProps) => (
  <Text {...p} style={[{ fontFamily: F.arabic, color: C.gold, fontSize: 22, writingDirection: 'rtl', textAlign: 'center' }, style]} />
);

/** Petit sur-titre doré en capitales espacées. */
export const Label = ({ style, ...p }: TextProps) => (
  <Text {...p} style={[{ fontFamily: F.medium, color: C.gold, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase' }, style]} />
);

/** Grands chiffres fins (heures, compteurs). */
export const Num = ({ style, ...p }: TextProps) => (
  <Text {...p} style={[{ fontFamily: F.thin, color: C.text, fontSize: 64, fontVariant: ['tabular-nums'] }, style]} />
);
