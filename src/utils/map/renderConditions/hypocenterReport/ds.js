import { leaflet } from "../../initMap.js";
import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import { map } from "../../initMap.js";
import clear551, { currentLayers } from "../../internal/clear551.js";
import { internalBound } from "../../internal/internalBound.js";
import playSound from "../../../sound/playSound.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";

export async function updateEpicenterIcon(
  epicenterLng,
  epicenterLat,
  epicenterType
) {
  // Remove existing epicenter icon if it exists
  if (currentLayers.epicenterIcon) {
    map.removeLayer(currentLayers.epicenterIcon);
  }

  // Create custom icon
  const iconSize = epicenterType === "epicenter" ? [31, 31] : [30, 30];
  const epicenterIcon = leaflet.icon({
    iconUrl: `/assets/basemap/icons/${epicenterType}.png`,
    iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
    popupAnchor: [0, -iconSize[1] / 2]
  });

  // Create marker and add to map
  currentLayers.epicenterIcon = leaflet.marker([epicenterLat, epicenterLng], {
    icon: epicenterIcon
  }).addTo(map);
}

export async function plotStations(data) {
  // Remove existing stations layer
  if (currentLayers.stationsLayer) {
    map.removeLayer(currentLayers.stationsLayer);
  }

  try {
    const response = await fetch("/assets/comparision/stationRef.csv");
    if (!response.ok) {
      console.error("[ds/plotStations] bad stationRef data");
      throw new Error(
        `[ds/plotStations] failed to fetch stationRef.csv: ${response.status} ${response.statusText}`
      );
    }

    const csvText = await response.text();
    const stationMap = new Map();

    const lines = csvText.trim().split("\n");
    for (let i = 0; i < lines.length; i++) {
      const [name, , , lat, long] = lines[i].split(",");
      stationMap.set(name, { lat: parseFloat(lat), long: parseFloat(long) });
    }

    const stationCoordinates = [];
    const stationMarkers = [];

    for (const point of data.points) {
      const stationInfo = stationMap.get(point.addr);

      if (stationInfo) {
        // Create icon for this intensity scale
        const stationIcon = leaflet.icon({
          iconUrl: `/assets/basemap/icons/intensities/${point.scale}.png`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10]
        });

        // Create marker
        const marker = leaflet.marker([stationInfo.lat, stationInfo.long], {
          icon: stationIcon
        });

        // Add popup with station info
        marker.bindPopup(`
          <strong>${point.addr}</strong><br>
          Prefecture: ${point.pref}<br>
          Intensity: ${point.scale}
        `);

        stationMarkers.push(marker);
        stationCoordinates.push([stationInfo.long, stationInfo.lat]);
      } else {
        console.warn(
          `[ds/plotStations] station not found in ref data: ${point.addr}`
        );
      }
    }

    // Create layer group and add to map
    currentLayers.stationsLayer = leaflet.layerGroup(stationMarkers).addTo(map);

    return stationCoordinates;
  } catch (error) {
    console.error("[ds/plotStations] error plotting stations: ", error);
    return [];
  }
}

export async function boundMarkers(epicenter, stationCoordinates) {
  const bounds = leaflet.latLngBounds([]);

  bounds.extend([epicenter.latitude, epicenter.longitude]);

  if (stationCoordinates && stationCoordinates.length > 0) {
    for (const [long, lat] of stationCoordinates) {
      bounds.extend([lat, long]);
    }
  } else {
    console.warn(
      "[ds] no station coordinates available for bounding, using epicenter only"
    );
  }

  internalBound(bounds);
}

export async function renderDS(data) {
  playSound("detailScale", 0.5);
  clear551();
  armIntList();

  const hyp = data.earthquake.hypocenter;
  updateInfoBox(
    "Detailed Epicenter Information",
    hyp.name,
    hyp.magnitude,
    hyp.depth,
    data.earthquake.time,
    "",
    data.earthquake.maxScale
  );
  const epicenterLat = hyp.latitude;
  const epicenterLng = hyp.longitude;

  await updateEpicenterIcon(epicenterLng, epicenterLat, "epicenter");

  const stationCoordinates = await plotStations(data);
  await boundMarkers(data.earthquake.hypocenter, stationCoordinates);
  const stationMap = await getStationMap();
  await updateIntList(data, stationMap);
  console.info("[ds] renderDS completed");
}

async function getStationMap() {
  const response = await fetch("/assets/comparision/stationRef.csv");
  if (!response.ok) {
    throw new Error(`Failed to fetch stationRef.csv: ${response.status}`);
  }
  const csvText = await response.text();
  const stationMap = new Map();
  const lines = csvText.trim().split("\n");
  for (let i = 0; i < lines.length; i++) {
    const [name, , , lat, long] = lines[i].split(",");
    stationMap.set(name, { lat: parseFloat(lat), long: parseFloat(long) });
  }
  return stationMap;
}
