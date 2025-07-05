import { map } from "../initMap";

export default function clear551() {
  if (map.getLayer("prefsLayer")) {
    map.removeLayer("prefsLayer");
  }
  if (map.getSource("prefsSource")) {
    map.removeSource("prefsSource");
  }

  if (map.getLayer("epicenterIcon")) {
    map.removeLayer("epicenterIcon");
  }
  if (map.getSource("epicenterIcon")) {
    map.removeSource("epicenterIcon");
  }
}
