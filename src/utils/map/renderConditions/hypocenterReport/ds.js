import { L } from "../../initMap.js";
import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import { map } from "../../initMap.js";
import clear551 from "../../internal/clear551.js";
import { internalBound } from "../../internal/internalBound.js";
import playSound from "../../../sound/playSound.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";

// Leaflet layer groups for managing map features
let epicenterLayer = null;
let stationsLayer = null;

/**
 * Helper function to update the epicenter icon on the map.
 *
 * @param {*} epicenterLng Longitude of the epicenter
 * @param {*} epicenterLat Latitude of the epicenter
 * @param {*} epicenterType Type of the epicenter (e.g., "epicenter", "potentialEpicenter") and displays it's respective icon on the map.
 */
export async function updateEpicenterIcon(
  epicenterLng,
  epicenterLat,
  epicenterType
) {
  // Remove existing epicenter layer
  if (epicenterLayer) {
    map.removeLayer(epicenterLayer);
    epicenterLayer = null;
  }

  // Create custom icon
  const iconUrl = `/assets/basemap/icons/${epicenterType}.png`;
  const iconSize = epicenterType === "epicenter" ? 31 : 30;
  
  const epicenterIcon = L.icon({
    iconUrl: iconUrl,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2]
  });

  // Create marker and add to map
  epicenterLayer = L.marker([epicenterLat, epicenterLng], {
    icon: epicenterIcon
  }).addTo(map);
}

/**
 * Iterate and plots the stations with it's intensity on the map.
 *
 * @param {*} data Data containing station information.
 * @returns {Promise<Array>} Returns a promise that resolves to an array of station coordinates.
 */
export async function plotStations(data) {
  // Remove existing stations layer
  if (stationsLayer) {
    map.removeLayer(stationsLayer);
    stationsLayer = null;
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
    const markers = [];

    for (const point of data.points) {
      const stationInfo = stationMap.get(point.addr);

      if (stationInfo) {
        // Create icon for this intensity level
        const iconUrl = `/assets/basemap/icons/intensities/${point.scale}.png`;
        let stationIcon;
        
        try {
          stationIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });
        } catch (error) {
          console.warn(
            `[ds/plotStations] bad scale image: ${point.scale}, using fallback`
          );
          stationIcon = L.icon({
            iconUrl: "/assets/basemap/icons/intensities/invalid.png",
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });
        }

        // Create marker
        const marker = L.marker([stationInfo.lat, stationInfo.long], {
          icon: stationIcon
        });

        // Add popup with station information
        marker.bindPopup(`
          <strong>${point.addr}</strong><br>
          Prefecture: ${point.pref}<br>
          Intensity: ${point.scale}
        `);

        markers.push(marker);
        stationCoordinates.push([stationInfo.long, stationInfo.lat]);
      } else {
        console.warn(
          `[ds/plotStations] station not found in ref data: ${point.addr}`
        );
      }
    }

    // Create layer group and add all markers
    stationsLayer = L.layerGroup(markers).addTo(map);

    return stationCoordinates;
  } catch (error) {
    console.error("[ds/plotStations] error plotting stations: ", error);
    return [];
  }
}

/**
 * Bounds the map view to the epicenter and stations.
 *
 * @param {*} epicenter The epicenter coordinates.
 * @param {*} stationCoordinates The coordinates of the stations.
 */
export async function boundMarkers(epicenter, stationCoordinates) {
  const bounds = L.latLngBounds();

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

/**
 * A part of the main rendering logic for DetailScale (DS) on response code 551.
 *
 * Renders the DetailScale data on the map and updates the information box and sidebar.
 *
 * Includes:
 * - Clearing previous plotted data
 * - Epicenter icon update
 * - Station plotting with intensity
 * - Map bounding to epicenter and stations
 * - Info box update with detailed epicenter information
 *
 * @param {*} data The DetailScale data to render.
 */
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
