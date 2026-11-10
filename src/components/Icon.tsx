import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { C } from '../lib/theme';

export type IconName =
  | 'home' | 'progress' | 'qr' | 'dhikr' | 'moon' | 'settings' | 'back' | 'close' | 'chevron' | 'pin'
  | 'clock' | 'book' | 'tahajjud' | 'sunna' | 'shield' | 'shieldCheck' | 'shieldAlert' | 'compass' | 'flame' | 'sun'
  | 'lock' | 'unlock' | 'check' | 'camera' | 'torch' | 'bell' | 'search' | 'play' | 'plus' | 'minus' | 'refresh'
  | 'sunrise' | 'x' | 'phone' | 'share';

/** Icônes au trait, dessinées pour Noor Salat (même style que la maquette). */
export function Icon({ name, size = 22, color = C.text, stroke = 1.7 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const body = (() => {
    switch (name) {
      case 'home': return <Path {...p} d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />;
      case 'progress': return <Path {...p} d="M5 20v-7M12 20V5M19 20v-10" />;
      case 'qr': return <><Rect {...p} x={3} y={3} width={7} height={7} rx={1.5} /><Rect {...p} x={14} y={3} width={7} height={7} rx={1.5} /><Rect {...p} x={3} y={14} width={7} height={7} rx={1.5} /><Path {...p} d="M14 14h3v3h-3zM18 18h3v3h-3z" /></>;
      case 'dhikr': return <><Circle {...p} cx={12} cy={12} r={7.5} /><Circle cx={12} cy={4.5} r={2} fill={color} /></>;
      case 'moon': return <Path {...p} d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />;
      case 'settings': return <><Path {...p} d="M4 7h10M18 7h2M4 17h4M12 17h8" /><Circle {...p} cx={16} cy={7} r={2} /><Circle {...p} cx={10} cy={17} r={2} /></>;
      case 'back': return <Path {...p} d="M15 5l-7 7 7 7" />;
      case 'chevron': return <Path {...p} d="M9 6l6 6-6 6" />;
      case 'close': case 'x': return <Path {...p} d="M6 6l12 12M18 6 6 18" />;
      case 'pin': return <><Path {...p} d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><Circle {...p} cx={12} cy={10} r={2.5} /></>;
      case 'clock': return <><Circle {...p} cx={12} cy={12} r={8.5} /><Path {...p} d="M12 7v5l3 2" /></>;
      case 'book': return <Path {...p} d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5c-3-.5-6 0-8 1.5zM12 6v14.5" />;
      case 'tahajjud': return <Path {...p} d="M19 15.5A7.5 7.5 0 1 1 10 5a6 6 0 0 0 9 10.5zM18 3v3M16.5 4.5h3" />;
      case 'sunna': return <Path {...p} d="M10 6h10M10 12h10M10 18h10M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17" />;
      case 'shield': return <Path {...p} d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" />;
      case 'shieldCheck': return <Path {...p} d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6zM9 12l2 2 4-4" />;
      case 'shieldAlert': return <Path {...p} d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6zM12 9v4M12 16h.01" />;
      case 'compass': return <><Circle {...p} cx={12} cy={12} r={8.5} /><Path {...p} d="M14.5 9.5 13 13l-3.5 1.5L11 11z" /></>;
      case 'flame': return <Path {...p} d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-1.5 2-2 3.5-2 5-1.5-1-2-2.5-2-4-2.5 2.5-4 5.5-4 9a6 6 0 0 0 6 6z" />;
      case 'sun': return <><Circle {...p} cx={12} cy={12} r={4} /><Path {...p} d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>;
      case 'sunrise': return <Path {...p} d="M4 18h16M7 18a5 5 0 0 1 10 0M12 5v3M5.5 9.5l1.5 1.5M18.5 9.5 17 11" />;
      case 'lock': return <><Rect {...p} x={5} y={11} width={14} height={10} rx={2.5} /><Path {...p} d="M8 11V8a4 4 0 0 1 8 0v3" /></>;
      case 'unlock': return <><Rect {...p} x={5} y={11} width={14} height={10} rx={2.5} /><Path {...p} d="M8 11V8a4 4 0 0 1 7.5-2" /></>;
      case 'check': return <Path {...p} d="M5 12.5 10 17 19 7" />;
      case 'camera': return <><Path {...p} d="M3 8h4l2-3h6l2 3h4v12H3z" /><Circle {...p} cx={12} cy={13} r={3.5} /></>;
      case 'torch': return <Path {...p} d="M7 3h10l-2 6H9zM9 9h6v12H9z" />;
      case 'bell': return <><Path {...p} d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><Path {...p} d="M10 21h4" /></>;
      case 'search': return <><Circle {...p} cx={11} cy={11} r={6.5} /><Path {...p} d="M20 20l-4-4" /></>;
      case 'play': return <Path d="M7 4l13 8-13 8z" fill={color} />;
      case 'plus': return <Path {...p} d="M12 5v14M5 12h14" />;
      case 'minus': return <Path {...p} d="M5 12h14" />;
      case 'refresh': return <Path {...p} d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" />;
      case 'phone': return <Path {...p} d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />;
      case 'share': return <Path {...p} d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />;
    }
  })();
  return <Svg width={size} height={size} viewBox="0 0 24 24">{body}</Svg>;
}
