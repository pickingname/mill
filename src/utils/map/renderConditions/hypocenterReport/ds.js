import L from "leaflet";
import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import { map } from "../../initMap.js";
import clear551 from "../../internal/clear551.js";
import { internalBound } from "../../internal/internalBound.js";
import playSound from "../../../sound/playSound.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";

// Store layer groups for easy removal
let epicenterMarker = null;
let stationsLayerGroup = null;

export async function updateEpicenterIcon(
  epicenterLng,
  epicenterLat,
  epicenterType
) {
  // Remove existing epicenter marker
  if (epicenterMarker) {
    map.removeLayer(epicenterMarker);
  }

  const iconUrl = `/assets/basemap/icons/${epicenterType}.png`;
  const epicenterIcon = L.icon({
    iconUrl: iconUrl,
    iconSize: epicenterType === "epicenter" ? [31, 31] : [30, 30],
    iconAnchor: [15, 15]
  });

  epicenterMarker = L.marker([epicenterLat, epicenterLng], { 
    icon: epicenterIcon 
  }).addTo(map);
}

export async function plotStations(data) {
  // Remove existing stations layer
  if (stationsLayerGroup) {
    map.removeLayer(stationsLayerGroup);
  }
  
  stationsLayerGroup = L.layerGroup();

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

    for (const point of data.points) {
      const stationInfo = stationMap.get(point.addr);

      if (stationInfo) {
        try {
          const iconUrl = `/assets/basemap/icons/intensities/${point.scale}.png`;
          const stationIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const marker = L.marker([stationInfo.lat, stationInfo.long], { 
            icon: stationIcon 
          });
          
          // Add properties for later use
          marker.properties = {
            scale: point.scale,
            name: point.addr,
            pref: point.pref,
          };
          
          stationsLayerGroup.addLayer(marker);
          stationCoordinates.push([stationInfo.long, stationInfo.lat]);
        } catch (error) {
          console.warn(
            `[ds/plotStations] failed to create marker for ${point.addr}:`,
            error
          );
        }
      } else {
        console.warn(
          `[ds/plotStations] station not found in ref data: ${point.addr}`
        );
      }
    }

    map.addLayer(stationsLayerGroup);
    return stationCoordinates;
  } catch (error) {
    console.error("[ds/plotStations] error plotting stations: ", error);
    return [];
  }
}

export async function boundMarkers(epicenter, stationCoordinates) {
  const bounds = L.latLngBounds();

  bounds.extend([epicenter.latitude, epicenter.longitude]);

  if (stationCoordinates && stationCoordinates.length > 0) {
    for (const [long, lat] of stationCoordinates) {
      bounds.extend([lat, long]); // Note: Leaflet uses [lat, lng]
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
