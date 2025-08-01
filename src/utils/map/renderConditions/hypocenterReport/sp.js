import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";
import playSound from "../../../sound/playSound.js";
import { map, L } from "../../initMap.js";
import clear551, { registerLayer } from "../../internal/clear551.js";
import { internalBound } from "../../internal/internalBound.js";

// Global layer for cleanup
let prefsLayer = null;

/**
 * Get mappings for the prefecture data (like lat,lon) from a CSV file.
 *
 * @returns {Promise<Map>} Returns a promise that resolves to a Mappings of prefecture data.
 */
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

/**
 * Function to plot regions as icons on the map based on the provided data, intensity (or called scale) and prefecture map.
 *
 * @param {*} data
 * @param {*} prefectureMap
 * @returns {Promise<Array>} Returns a promise that resolves to an array of prefecture coordinates.
 */
export async function plotRegions(data, prefectureMap) {
  try {

    // Remove existing prefecture layer
    if (prefsLayer) {
      map.removeLayer(prefsLayer);
    }

    const prefectureCoordinates = [];
    const markers = [];

    for (const point of data.points) {
      const prefectureInfo = prefectureMap.get(point.addr);

      if (prefectureInfo) {
        // Create icon for this scale level
        const iconUrl = `/assets/basemap/icons/scales/${point.scale}.png`;
        let regionIcon;
        
        try {
          regionIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });
        } catch (error) {
          console.warn(
            `[sp/plotRegions] bad scale image: ${point.scale}, using fallback`
          );
          regionIcon = L.icon({
            iconUrl: "/assets/basemap/icons/scales/invalid.png",
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });
        }

        // Create marker
        const marker = L.marker([prefectureInfo.lat, prefectureInfo.lng], {
          icon: regionIcon
        });

        // Add popup with region information
        marker.bindPopup(`
          <strong>${point.addr}</strong><br>
          Prefecture: ${point.pref}<br>
          Scale: ${point.scale}
        `);

        markers.push(marker);
        prefectureCoordinates.push([prefectureInfo.lng, prefectureInfo.lat]);
      } else {
        console.warn(
          `[sp/plotRegions] prefecture not found in ref data: ${point.addr}`
        );
      }
    }

    // Create layer group and add all markers
    prefsLayer = L.layerGroup(markers).addTo(map);
    
    // Register layer for cleanup
    registerLayer("prefsLayer", prefsLayer);

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
    const bounds = L.latLngBounds();

    prefectureCoordinates.forEach((coord) => {
      // Convert [lng, lat] to [lat, lng] for Leaflet
      bounds.extend([coord[1], coord[0]]);
    });

    internalBound(bounds);
  } catch (error) {
    console.error("[sp/boundRegions] error setting map bounds: ", error);
  }
}

/**
 * A part of the main rendering logic for ScalePrompt (SP) on response code 551.
 *
 * Renders the ScalePrompt data on the map and updates the information box and sidebar.
 *
 * Includes:
 * - Clearing previous plotted data
 * - Prefecture icon update
 * - Prefecture bounding
 * - Information box update
 *
 * @param {*} data
 */
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
