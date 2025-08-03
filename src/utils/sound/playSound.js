/**
 * Function to play a sound file.
 *
 * @param {String} filename Name of the sound file without extension (MUST be in /assets/audio/).
 * @param {Number} volume Volume of the sound, between 0 and 1.
 *
 */
export default function playSound(filename, volume = 0.5) {
  const audio = new Audio(`/assets/audio/${filename}.mp3`);
  audio.volume = Math.max(0, Math.min(1, volume));
  audio
    .play()
    .catch((error) => console.error("[playSound] playback failed: ", error));
}
