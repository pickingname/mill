import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import { armIntList } from "../../../components/infoBox/updateIntList.js";
import playSound from "../../../sound/playSound.js";
import { map, mapboxgl } from "../../initMap.js";
import clear551 from "../../internal/clear551.js";
import { internalBound } from "../../internal/internalBound.js";

export async function plotRegions(data) {
  playSound("scalePrompt", 0.5);
  clear551();
  armIntList();

  try {
    const response = await fetch("/assets/comparision/prefectureRef.csv");
    if (!response.ok) {
      console.error("[sp/plotRegions] bad prefectureRef data");
      throw new Error(
        `[sp/plotRegions] failed to fetch prefectureRef.csv: ${response.status} ${response.statusText}`
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
        });
      }
    }

    const features = [];
    const iconPromises = [];
    const loadedIcons = new Set();
    const prefectureCoordinates = [];

    const scaleValues = new Set(data.points.map((point) => point.scale));

    for (const scale of scaleValues) {
      const iconName = `scale-${scale}`;

      if (!map.hasImage(iconName) && !loadedIcons.has(iconName)) {
        loadedIcons.add(iconName);
        const iconPromise = new Promise((resolve, reject) => {
          map.loadImage(
            `/assets/basemap/icons/scales/${scale}.png`,
            (error, image) => {
              if (error) {
                console.warn(
                  `[sp/plotRegions] bad scale image: ${scale}, `,
                  error,
                  " using fallback"
                );
                map.loadImage(
                  "/assets/basemap/icons/scales/invalid.png",
                  (fallbackError, fallbackImage) => {
                    if (fallbackError) {
                      console.error(
                        `[sp/plotRegions] failed to load fallback icon: ${iconName} `,
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

    for (const point of data.points) {
      const prefectureInfo = prefectureMap.get(point.addr);

      if (prefectureInfo) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [prefectureInfo.lng, prefectureInfo.lat],
          },
          properties: {
            scale: point.scale,
            addr: point.addr,
            pref: point.pref,
            isArea: point.isArea,
          },
        });
        prefectureCoordinates.push([prefectureInfo.lng, prefectureInfo.lat]);
      } else {
        console.warn(
          `[sp/plotRegions] prefecture not found in ref data: ${point.addr}`
        );
      }
    }

    map.addSource("prefsSource", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: features,
      },
    });

    map.addLayer({
      id: "prefsLayer",
      type: "symbol",
      source: "prefsSource",
      layout: {
        "icon-image": ["concat", "scale-", ["to-string", ["get", "scale"]]],
        "icon-size": 20 / 30, // USAGE: mapIconSizePX / imageSizePX
        "icon-allow-overlap": true,
      },
    });

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
    const bounds = new mapboxgl.LngLatBounds();

    prefectureCoordinates.forEach((coord) => {
      bounds.extend(coord);
    });

    internalBound(bounds);
  } catch (error) {
    console.error("[sp/boundRegions] error setting map bounds: ", error);
  }
}

export async function renderSP(data) {
  updateInfoBox(
    "Flash Report",
    "Evalulating Epicenter",
    "--",
    "Unknown",
    data.earthquake.time,
    "",
    data.earthquake.maxScale
  );

  const prefectureCoordinates = await plotRegions(data);
  await boundRegions(prefectureCoordinates);
}
