/**
 * gets the current time period from the browser time
 * used to determine the map's light preset
 *
 * @returns {string} - returns "day", "dawn", "dusk", or "night"
 */
function getMapPreset() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 6 && hour < 9) {
    return "dawn";
  } else if (hour >= 9 && hour < 16) {
    return "day";
  } else if (hour >= 16 && hour < 19) {
    return "dusk";
  } else {
    return "night";
  }
}

export default getMapPreset;
