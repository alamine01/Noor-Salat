/**
 * Compteur de squats avec l'accéléromètre (téléphone tenu en main).
 *
 * Un squat donne toujours la même « signature » sur la force ressentie (en g) :
 *   descente : < 1 g (on « tombe »), puis > 1 g (on freine en bas)
 *   remontée : > 1 g (on pousse), puis < 1 g (on ralentit en haut)
 * On compte un squat quand on a vu : creux → pic → creux, en un temps humain (0,7 à 4 s).
 * Les secousses (valeurs extrêmes ou cycles trop rapides) ne comptent pas.
 *
 * Les seuils sont réglables : à ajuster après essai sur un vrai téléphone.
 */
export type SquatTuning = { low: number; high: number; minCycleMs: number; maxCycleMs: number; shake: number; smooth: number };
export const DEFAULT_TUNING: SquatTuning = { low: 0.88, high: 1.12, minCycleMs: 700, maxCycleMs: 4000, shake: 2.4, smooth: 0.25 };

type State = 'idle' | 'falling' | 'bottom';

export function createSquatCounter(onSquat: () => void, tune: SquatTuning = DEFAULT_TUNING) {
  let ema = 1;
  let state: State = 'idle';
  let start = 0;
  let quietUntil = 0;

  return function feed(x: number, y: number, z: number, t = Date.now()) {
    const g = Math.sqrt(x * x + y * y + z * z);
    // Secousse : on oublie tout pendant 1 s.
    if (g > tune.shake || g < 0.15) { state = 'idle'; quietUntil = t + 1000; ema = 1; return; }
    ema = ema + tune.smooth * (g - ema);
    if (t < quietUntil) return;

    if (state === 'idle') {
      if (ema < tune.low) { state = 'falling'; start = t; }
    } else if (state === 'falling') {
      if (t - start > tune.maxCycleMs) state = 'idle';
      else if (ema > tune.high) state = 'bottom';
    } else if (state === 'bottom') {
      if (t - start > tune.maxCycleMs) state = 'idle';
      else if (ema < tune.low) {
        const dur = t - start;
        state = 'idle';
        if (dur >= tune.minCycleMs) { onSquat(); quietUntil = t + 300; }
        else quietUntil = t + 600; // trop rapide : c'est une secousse
      }
    }
  };
}
