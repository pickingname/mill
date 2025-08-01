import epicenterRef from "../../special/epicenterRef.json";

/**
 * Translates an untransalted epicenter name to its English equivalent.
 *
 * @param {String} unTranslatedEpicenter
 * @returns {String} The English equivalent of the epicenter name, or the original name if unavailable.
 */
export default function translateEpicenter(unTranslatedEpicenter) {
  const found = epicenterRef.find((item) => item.jp === unTranslatedEpicenter);
  return found ? found.en : unTranslatedEpicenter;
}
