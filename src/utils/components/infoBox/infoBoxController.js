import classifyIntensity from "../../classification/classifyIntensity.js";
import translateEpicenter from "../../classification/translateEpicenter.js";

export function showInfoBox() {
  document.getElementById("infoContainer").classList.remove("hidden");
}

export function hideInfoBox() {
  document.getElementById("infoContainer").classList.add("hidden");
}

/**
 * Update the text in the infoBox component in the UI.
 *
 * @param {String} reportType The report type (e.g "Hypocenter Report", "Flash Report" etc.)
 * @param {String} unTranslatedEpicenter Untranslated epicenter name, this will be translated
 * @param {Number} magnitude Magnitude of the earthquake
 * @param {Number} depth Depth of the earthquake
 * @param {String} time The time given by the API, default api TZ: JST (GMT+9)
 * @param {String} additionalInfo Additional information about the earthquake (UNUSED)
 * @param {String} maxInt Maximum intensity of the earthquake (e.g. "5+", "6-", etc.)
 */
export function updateInfoBox(
  reportType,
  unTranslatedEpicenter,
  magnitude,
  depth,
  time,
  additionalInfo,
  maxInt
) {
  document.getElementById("reportType").textContent = reportType;
  document.getElementById("location").textContent = translateEpicenter(
    unTranslatedEpicenter
  );
  document.getElementById("magnitude").textContent =
    magnitude == -1 || !magnitude ? "--" : magnitude;
  document.getElementById("depth").textContent =
    depth == "Unknown" || !depth || depth == "" || depth == -1
      ? "Unavailable"
      : depth + " km";
  document.getElementById("time").textContent = !time
    ? "Unavailable"
    : time + " JST";
  document.getElementById("maxInt").textContent = classifyIntensity(maxInt);
}
