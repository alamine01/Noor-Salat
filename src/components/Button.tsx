import { StyleProp, ViewStyle } from 'react-native';
import { GhostButton, PrimaryButton } from './ui';

/** Ancien bouton, gardé pour compatibilité : redirige vers les nouveaux boutons. */
export function Button({ title, onPress, style, ghost }: { title: string; onPress?: () => void; style?: StyleProp<ViewStyle>; ghost?: boolean }) {
  return ghost ? <GhostButton title={title} onPress={onPress} style={style} /> : <PrimaryButton title={title} onPress={onPress} style={style} />;
}
