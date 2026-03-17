import { config } from "../config";

export function getYahooEEWDate() {
  return new Date(Date.now() - config.api.eewDelay)
    .toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })
    .replace(/-/g, "");
}

export function getYahooEEWDateTime() {
  return new Date(Date.now() - config.api.eewDelay)
    .toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
    .replace(/[-: ]/g, "");
}
