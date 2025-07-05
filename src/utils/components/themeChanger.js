import getMapPreset from "../date/getMapPreset.js";

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
  }
}

export function setTheme(theme) {
  if (theme === "dark") {
    document.getElementById("infoContainer").classList.remove("light");
    document.getElementById("infoContainer").classList.add("dark");
  } else {
    document.getElementById("infoContainer").classList.remove("dark");
    document.getElementById("infoContainer").classList.add("light");
  }
}
