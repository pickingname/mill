import {config} from "../../config";
import {map} from "../initMap.js";

export function internalBound(bound) {
  map.fitBounds(bound, {
    padding: config.map.bound_padding,
    duration: config.map.bound_duration,
    easing: (t) => 1 - Math.pow(1 - t, 5),
    linear: true
  });
}
