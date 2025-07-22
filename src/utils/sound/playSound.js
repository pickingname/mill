function playSound(filename, volume = 1) {
  const audio = new Audio(`/assets/audio/${filename}.mp3`);
  audio.volume = Math.max(0, Math.min(1, volume));
  audio
    .play()
    .catch((error) => console.error("[playSound] playback failed: ", error));
}
