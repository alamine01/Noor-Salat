import { createAudioPlayer } from 'expo-audio';

const DING = require('../../assets/sounds/ding.wav');
const WOOSH = require('../../assets/sounds/woosh.wav');

function play(src: number) {
  try {
    const p = createAudioPlayer(src);
    p.play();
    setTimeout(() => p.remove(), 3000);
  } catch {}
}

export const playDing = () => play(DING); // validation du scan
export const playWoosh = () => play(WOOSH); // déblocage
