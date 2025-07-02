import {config} from "../../config";
import {map} from "../initMap.js";

export function internalBound(bound) {
  map.fitBounds(bound, {
    padding: config.map.bound_padding,
    duration: 500,
    easing: (t) => 1 - Math.pow(1 - t, 5),
  });
}
