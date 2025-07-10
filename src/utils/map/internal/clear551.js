import { map } from "../initMap";

export default function clear551() {
  const layersToRemove = [
    "prefsLayer",
    "epicenterIcon",
    "stationsLayer",
    "eewAreasLayer",
  ];

  const sourcesToRemove = [
    "prefsSource",
    "epicenterIcon",
    "eewAreasSource",
    "stationsLayer",
    "prefsSource",
  ];

  layersToRemove.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });

  sourcesToRemove.forEach((sourceId) => {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  });
}
