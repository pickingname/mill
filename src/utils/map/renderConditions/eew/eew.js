import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import clear551, { registerLayer } from "../../internal/clear551";
import { updateEpicenterIcon } from "../hypocenterReport/ds";
import { map, L } from "../../initMap.js";
import { internalBound } from "../../internal/internalBound.js";
import playSound from "../../../sound/playSound.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";

// Global layer for cleanup
let eewAreasLayer = null;
import { getPrefectureMap } from "../hypocenterReport/sp.js";

/**
 * A part of the main rendering logic for Earthquake Early Warning (EEW) on response code 556.
 *
 * Renders the EEW data on the map
 *
 * Includes:
 * - Clearing plotted 551 datas.
 * - Epicenter icon update
 * - Area plotting with scale icons
 * - Information box update
 *
 * @param {Object} data - The EEW data to render.
 */
export default async function renderEEW(data) {
  playSound("eew", 0.5);
  clear551();
  armIntList();

  const hyp = data.earthquake.hypocenter;
  const epicenterLat = hyp.latitude;
  const epicenterLng = hyp.longitude;
  await updateEpicenterIcon(epicenterLng, epicenterLat, "potentialEpicenter");

  let areaCoordinates = [];
  try {
    const prefectureMap = await getPrefectureMap();
    const markers = [];

    for (const area of data.areas || []) {
      const areaName = area.name;
      const scaleTo = parseInt(area.scaleTo, 10);
      const prefectureInfo = prefectureMap.get(areaName);

      if (prefectureInfo) {
        // Create icon for this scale level
        const iconUrl = `/assets/basemap/icons/scales/${scaleTo}.png`;
        let areaIcon;
        
        try {
          areaIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });
        } catch (error) {
          console.warn(
            `[renderEEW] bad scale image: ${scaleTo}, using fallback`
          );
          areaIcon = L.icon({
            iconUrl: "/assets/basemap/icons/scales/invalid.png",
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
          });
        }

        // Create marker
        const marker = L.marker([prefectureInfo.lat, prefectureInfo.lng], {
          icon: areaIcon
        });

        // Add popup with area information
        marker.bindPopup(`
          <strong>${areaName}</strong><br>
          Prefecture: ${area.pref}<br>
          Expected Intensity: ${scaleTo}
        `);

        markers.push(marker);
        areaCoordinates.push([prefectureInfo.lng, prefectureInfo.lat]);
      } else {
        console.warn(`[renderEEW] area not found in ref data: ${areaName}`);
      }
    }

    // Create layer group and add all markers
    if (eewAreasLayer) {
      map.removeLayer(eewAreasLayer);
    }
    eewAreasLayer = L.layerGroup(markers).addTo(map);
    
    // Register layer for cleanup
    registerLayer("eewAreasLayer", eewAreasLayer);

    const points = (data.areas || []).map((area) => ({
      addr: area.name,
      scale: parseInt(area.scaleTo, 10),
      pref: area.pref,
      isArea: true,
    }));
    await updateIntList({ points }, prefectureMap);
  } catch (error) {
    console.error("[renderEEW] error plotting areas: ", error);
  }

  const bounds = L.latLngBounds();
  bounds.extend([epicenterLat, epicenterLng]);
  if (areaCoordinates && areaCoordinates.length > 0) {
    areaCoordinates.forEach((coord) => {
      // Convert [lng, lat] to [lat, lng] for Leaflet
      bounds.extend([coord[1], coord[0]]);
    });
  }
  internalBound(bounds);

  updateInfoBox(
    "Earthquake Early Warning",
    hyp.name,
    hyp.magnitude,
    hyp.depth,
    data.earthquake.originTime,
    "",
    "--"
  );
}
