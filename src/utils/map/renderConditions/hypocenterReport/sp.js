import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";
import playSound from "../../../sound/playSound.js";
import { map, leaflet } from "../../initMap.js";
import clear551, { currentLayers } from "../../internal/clear551.js";
import { internalBound } from "../../internal/internalBound.js";

export async function getPrefectureMap() {
  const response = await fetch("/assets/comparision/prefectureRef.csv");
  if (!response.ok) {
    console.error("[sp/getPrefectureMap] bad prefectureRef data");
    throw new Error(
      `[sp/getPrefectureMap] failed to fetch prefectureRef.csv: ${response.status} ${response.statusText}`
    );
  }

  const csvText = await response.text();
  const prefectureMap = new Map();

  const lines = csvText.trim().split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const [code, name, fullname, code2, lat, long] = line.split(",");
      prefectureMap.set(name, {
        lat: parseFloat(lat),
        lng: parseFloat(long),
        code: code,
        fullname: fullname,
      });
    }
  }
  return prefectureMap;
}

export async function plotRegions(data, prefectureMap) {
  try {
    const prefectureCoordinates = [];
    const regionMarkers = [];

    for (const point of data.points) {
      const prefectureInfo = prefectureMap.get(point.addr);

      if (prefectureInfo) {
        // Create icon for this scale
        const scaleIcon = leaflet.icon({
          iconUrl: `/assets/basemap/icons/scales/${point.scale}.png`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10]
        });

        // Create marker
        const marker = leaflet.marker([prefectureInfo.lat, prefectureInfo.lng], {
          icon: scaleIcon
        });

        // Add popup with region info
        marker.bindPopup(`
          <strong>${point.addr}</strong><br>
          Intensity Scale: ${point.scale}<br>
          Prefecture: ${point.pref || 'Unknown'}<br>
          ${point.isArea ? 'Area' : 'Point'} measurement
        `);

        regionMarkers.push(marker);
        prefectureCoordinates.push([prefectureInfo.lng, prefectureInfo.lat]);
      } else {
        console.warn(
          `[sp/plotRegions] prefecture not found in ref data: ${point.addr}`
        );
      }
    }

    // Create layer group for prefecture regions
    if (regionMarkers.length > 0) {
      currentLayers.prefsLayer = leaflet.layerGroup(regionMarkers).addTo(map);
    }

    return prefectureCoordinates;
  } catch (error) {
    console.error("[sp/plotRegions] error plotting regions: ", error);
    return [];
  }
}

export async function boundRegions(prefectureCoordinates) {
  if (!prefectureCoordinates || prefectureCoordinates.length === 0) {
    console.warn("[sp/boundRegions] no coordinates to bound");
    return;
  }

  try {
    const bounds = leaflet.latLngBounds([]);

    prefectureCoordinates.forEach((coord) => {
      bounds.extend([coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
    });

    internalBound(bounds);
  } catch (error) {
    console.error("[sp/boundRegions] error setting map bounds: ", error);
  }
}

export async function renderSP(data) {
  playSound("scalePrompt", 0.5);
  clear551();
  armIntList();
  updateInfoBox(
    "Flash Report",
    "Evalulating Epicenter",
    "--",
    "Unknown",
    data.earthquake.time,
    "",
    data.earthquake.maxScale
  );

  const prefectureMap = await getPrefectureMap();
  const prefectureCoordinates = await plotRegions(data, prefectureMap);
  await boundRegions(prefectureCoordinates);
  await updateIntList(data, prefectureMap);
}
