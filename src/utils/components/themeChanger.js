import getMapPreset from "../date/getMapPreset.js";

/**
 * Mapbox default theme includes four themes: day, dawn, dusk, and night.
 * This util function sets the COMPONENT theme (which can either be "light" or "dark") based on the current time of day by calling getMapPreset() and switching the return value.
 */
export default function autoTheme() {
  const currentTheme = getMapPreset() || "day";
  switch (currentTheme) {
    case "day":
      setTheme("light");
      break;
    case "dawn":
      setTheme("light");
      break;
    case "dusk":
      setTheme("dark");
      break;
    case "night":
      setTheme("dark");
      break;
    default:
      setTheme("light");
      break;
  }
}

export function setTheme(theme) {
  const root = document.documentElement;

  if (theme === "dark") {
    document.getElementById("infoContainer").classList.remove("light");
    document.getElementById("infoContainer").classList.add("dark");
    root.style.setProperty("color-scheme", "dark");
  } else {
    document.getElementById("infoContainer").classList.remove("dark");
    document.getElementById("infoContainer").classList.add("light");
    root.style.setProperty("color-scheme", "light");
  }
}
