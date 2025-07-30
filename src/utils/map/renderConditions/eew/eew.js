import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import clear551 from "../../internal/clear551";
import { updateEpicenterIcon } from "../hypocenterReport/ds";
import { map, L } from "../../initMap.js";
import { internalBound } from "../../internal/internalBound.js";
import playSound from "../../../sound/playSound.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";
import { getPrefectureMap } from "../hypocenterReport/sp.js";

// Store layer group for easy removal
let eewAreasLayerGroup = null;

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
    
    // Remove existing EEW areas layer
    if (eewAreasLayerGroup) {
      map.removeLayer(eewAreasLayerGroup);
    }
    
    eewAreasLayerGroup = L.layerGroup();

    for (const area of data.areas || []) {
      const areaName = area.name;
      const scaleTo = parseInt(area.scaleTo, 10);
      const prefectureInfo = prefectureMap.get(areaName);
      
      if (prefectureInfo) {
        try {
          const iconUrl = `/assets/basemap/icons/scales/${scaleTo}.png`;
          const areaIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const marker = L.marker([prefectureInfo.lat, prefectureInfo.lng], { 
            icon: areaIcon 
          });
          
          // Add properties for later use
          marker.properties = {
            scale: scaleTo,
            name: areaName,
            pref: area.pref,
          };
          
          eewAreasLayerGroup.addLayer(marker);
          areaCoordinates.push([prefectureInfo.lng, prefectureInfo.lat]);
        } catch (error) {
          console.warn(
            `[renderEEW] failed to create marker for ${areaName}:`,
            error
          );
        }
      } else {
        console.warn(`[renderEEW] area not found in ref data: ${areaName}`);
      }
    }

    map.addLayer(eewAreasLayerGroup);

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
  bounds.extend([epicenterLat, epicenterLng]); // Note: Leaflet uses [lat, lng]
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
