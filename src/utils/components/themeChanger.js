import getMapPreset from "../date/getMapPreset.js";

export default function themeChanger() {
  const currentTheme = getMapPreset() || "day";

  switch (currentTheme) {
    case "day":
      setTheme("light");
    case "dawn":
      setTheme("light");
    case "dusk":
      setTheme("dark");
    case "night":
      setTheme("dark");
  }
}

export function setTheme(theme) {
  if (theme === "light") {
    document.getElementById("infoContainer").classList.remove("dark");
    document.getElementById("infoContainer").classList.add("light");
  } else {
    document.getElementById("infoContainer").classList.remove("light");
    document.getElementById("infoContainer").classList.add("dark");
  }
}
