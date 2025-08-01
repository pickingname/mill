import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import clear551, { currentLayers } from "../../internal/clear551.js";
import { updateEpicenterIcon } from "../hypocenterReport/ds.js";
import { map, leaflet } from "../../initMap.js";
import { internalBound } from "../../internal/internalBound.js";
import playSound from "../../../sound/playSound.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";
import { getPrefectureMap } from "../hypocenterReport/sp.js";

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
    const areaMarkers = [];

    for (const area of data.areas || []) {
      const areaName = area.name;
      const scaleTo = parseInt(area.scaleTo, 10);
      const prefectureInfo = prefectureMap.get(areaName);
      
      if (prefectureInfo) {
        // Create icon for this scale
        const scaleIcon = leaflet.icon({
          iconUrl: `/assets/basemap/icons/scales/${scaleTo}.png`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10]
        });

        // Create marker
        const marker = leaflet.marker([prefectureInfo.lat, prefectureInfo.lng], {
          icon: scaleIcon
        });

        // Add popup with area info
        marker.bindPopup(`
          <strong>${areaName}</strong><br>
          Expected Intensity: ${scaleTo}<br>
          Prefecture: ${area.pref || 'Unknown'}
        `);

        areaMarkers.push(marker);
        areaCoordinates.push([prefectureInfo.lng, prefectureInfo.lat]);
      } else {
        console.warn(`[renderEEW] area not found in ref data: ${areaName}`);
      }
    }

    // Create layer group for EEW areas
    if (areaMarkers.length > 0) {
      currentLayers.eewAreasLayer = leaflet.layerGroup(areaMarkers).addTo(map);
    }

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

  const bounds = leaflet.latLngBounds([]);
  bounds.extend([epicenterLat, epicenterLng]);
  if (areaCoordinates && areaCoordinates.length > 0) {
    areaCoordinates.forEach((coord) => {
      bounds.extend([coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
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
