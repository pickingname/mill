import classifyIntensity from "../../classification/classifyIntensity.js";
import translateEpicenter from "../../classification/translateEpicenter.js";

export function showInfoBox() {
  document.getElementById("infoContainer").classList.remove("hidden");
}

export function hideInfoBox() {
  document.getElementById("infoContainer").classList.add("hidden");
}

export function updateInfoBox(
  reportType,
  unTranslatedEpicenter,
  magnitude,
  depth,
  time,
  additionalInfo,
  maxInt
) {
  // document.getElementById('reportType').textContent = reportType;
  document.getElementById("location").textContent = translateEpicenter(
    unTranslatedEpicenter
  );
  document.getElementById("magnitude").textContent = magnitude;
  document.getElementById("depth").textContent = depth + "km";
  document.getElementById("time").textContent = time;
  document.getElementById("maxInt").textContent = classifyIntensity(maxInt);
}
