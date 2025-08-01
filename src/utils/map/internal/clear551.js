import { map } from "../initMap";

/**
 * Iterate and clears all 551 response code related layers and sources from the map.
 *
 * Includes everything related to the 551 response code except for the tsunami layers.
 * This is used to reset the map state when a new 551 response code is received.
 */
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
