/**
 * Classifies the type of data based on the response (data) code (not HTTP status).
 *
 * 551 is a normal hypocenter related report like DetailScale or ScalePrompt.
 * 556 is a special warning (earthquake early warning) like Destination from 551 but includes more information.
 *
 * @param {Number} code
 * @returns {String} The type of data classified.
 */
export function classifyData(code) {
  switch (code) {
    case 551:
      return "hypocenter_report"; // normal case
    case 556:
      return "eew"; // special warning
    default:
      console.warn(`[classifyData] bad code: ${code}`);
      return "unsupported";
  }
}
