import {
  getYahooEEWDate,
  getYahooEEWDateTime,
} from "../../../date/getYahooEEWTime";

export function fmtYahooURL(str) {
  return str
    .replace(/\[D\]/g, getYahooEEWDate())
    .replace(/\[DT\]/g, getYahooEEWDateTime());
}
