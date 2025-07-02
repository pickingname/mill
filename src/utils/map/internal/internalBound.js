import { config } from "../../config";
import { map } from "../initMap.js";

export function internalBound(bound) {
  map.fitBounds(bound, {
    padding: config.MAP.DEFAULT_BOUND_PADDING,
    duration: 500,
    easing: (t) => 1 - Math.pow(1 - t, 5),
  });
}
