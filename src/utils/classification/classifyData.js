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
