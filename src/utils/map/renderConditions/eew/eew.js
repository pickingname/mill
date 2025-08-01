import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import clear551 from "../../internal/clear551";
import { updateEpicenterIcon } from "../hypocenterReport/ds";
import { map, mapboxgl } from "../../initMap.js";
import { internalBound } from "../../internal/internalBound.js";
import playSound from "../../../sound/playSound.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";
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
    const features = [];
    const iconPromises = [];
    const loadedIcons = new Set();
    for (const area of data.areas || []) {
      const areaName = area.name;
      const scaleTo = parseInt(area.scaleTo, 10);
      const iconName = `scale-${scaleTo}`;
      if (!map.hasImage(iconName) && !loadedIcons.has(iconName)) {
        loadedIcons.add(iconName);
        const iconPromise = new Promise((resolve, reject) => {
          map.loadImage(
            `/assets/basemap/icons/scales/${scaleTo}.png`,
            (error, image) => {
              if (error) {
                console.warn(
                  `[renderEEW] bad scale image: ${scaleTo}, `,
                  error,
                  " using fallback"
                );
                map.loadImage(
                  "/assets/basemap/icons/scales/invalid.png",
                  (fallbackError, fallbackImage) => {
                    if (fallbackError) {
                      console.error(
                        `[renderEEW] failed to load fallback icon: ${iconName} `,
                        fallbackError
                      );
                      reject(fallbackError);
                    } else {
                      map.addImage(iconName, fallbackImage);
                      resolve();
                    }
                  }
                );
              } else {
                map.addImage(iconName, image);
                resolve();
              }
            }
          );
        });
        iconPromises.push(iconPromise);
      }
    }
    await Promise.all(iconPromises);
    for (const area of data.areas || []) {
      const areaName = area.name;
      const scaleTo = parseInt(area.scaleTo, 10);
      const prefectureInfo = prefectureMap.get(areaName);
      if (prefectureInfo) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [prefectureInfo.lng, prefectureInfo.lat],
          },
          properties: {
            scale: scaleTo,
            name: areaName,
            pref: area.pref,
          },
        });
        areaCoordinates.push([prefectureInfo.lng, prefectureInfo.lat]);
      } else {
        console.warn(`[renderEEW] area not found in ref data: ${areaName}`);
      }
    }
    map.addSource("eewAreasSource", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: features,
      },
    });
    map.addLayer(
      {
        id: "eewAreasLayer",
        type: "symbol",
        source: "eewAreasSource",
        layout: {
          "icon-image": ["concat", "scale-", ["to-string", ["get", "scale"]]],
          "icon-size": 20 / 30,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
          "symbol-sort": ["get", "scale"],
        },
      },
      "epicenterIcon"
    );

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

  const bounds = new mapboxgl.LngLatBounds();
  bounds.extend([epicenterLng, epicenterLat]);
  if (areaCoordinates && areaCoordinates.length > 0) {
    areaCoordinates.forEach((coord) => {
      bounds.extend(coord);
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
