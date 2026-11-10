import { Text as RNText, TextInput as RNTextInput, TextInputProps, TextProps } from 'react-native';
import { C, F } from '../lib/theme';

/**
 * Limite de l'agrandissement des polices (réglage « Texte plus grand » du téléphone).
 * Au-delà, les mises en page débordent. 1,2 = jusqu'à +20 %, ce qui reste confortable à lire.
 */
export const MAX_FONT_SCALE = 1.2;

/** Remplace le Text de React Native partout dans l'appli : même chose, avec la limite d'agrandissement. */
export const Text = (p: TextProps) => <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...p} />;
export const TextInput = (p: TextInputProps) => <RNTextInput maxFontSizeMultiplier={MAX_FONT_SCALE} {...p} />;

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
