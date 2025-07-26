import mapboxgl from "mapbox-gl";
import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import { map } from "../../initMap.js";
import clear551 from "../../internal/clear551.js";
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
  if (!map.hasImage("epicenter")) {
    await new Promise((resolve, reject) => {
      map.loadImage(
        `/assets/basemap/icons/${epicenterType}.png`,
        (error, image) => {
          if (error) {
            reject(error);
            return;
          }
          map.addImage("epicenter", image);
          resolve();
        }
      );
    });
  }

  map.addSource("epicenterIcon", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [epicenterLng, epicenterLat],
          },
        },
      ],
    },
  });

  map.addLayer({
    id: "epicenterIcon",
    type: "symbol",
    source: "epicenterIcon",
    layout: {
      "icon-image": "epicenter",
      "icon-size": epicenterType === "epicenter" ? 31 / 31 : 30 / 100, // USAGE: mapIconSizePX / imageSizePX
    },
  });
}

export async function plotStations(data) {
  if (map.getLayer("stationsLayer")) {
    map.removeLayer("stationsLayer");
  }
  if (map.getSource("stationsLayer")) {
    map.removeSource("stationsLayer");
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

    const features = [];
    const iconPromises = [];
    const loadedIcons = new Set();
    const stationCoordinates = [];

    const scaleValues = new Set(data.points.map((point) => point.scale));

    for (const scale of scaleValues) {
      const iconName = `intensity-${scale}`;

      if (!map.hasImage(iconName) && !loadedIcons.has(iconName)) {
        loadedIcons.add(iconName);
        const iconPromise = new Promise((resolve, reject) => {
          map.loadImage(
            `/assets/basemap/icons/intensities/${scale}.png`,
            (error, image) => {
              if (error) {
                console.warn(
                  `[ds/plotStations] bad scale image: ${scale}, `,
                  error,
                  " using fallback"
                );
                map.loadImage(
                  "/assets/basemap/icons/intensities/invalid.png",
                  (fallbackError, fallbackImage) => {
                    if (fallbackError) {
                      console.error(
                        `[ds/plotStations] failed to load fallback icon: ${iconName} `,
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
      const stationInfo = stationMap.get(point.addr);

      if (stationInfo) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stationInfo.long, stationInfo.lat],
          },
          properties: {
            scale: point.scale,
            name: point.addr,
            pref: point.pref,
          },
        });
        stationCoordinates.push([stationInfo.long, stationInfo.lat]);
      } else {
        console.warn(
          `[ds/plotStations] station not found in ref data: ${point.addr}`
        );
      }
    }

    map.addSource("stationsLayer", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: features,
      },
    });

    map.addLayer(
      {
        id: "stationsLayer",
        type: "symbol",
        source: "stationsLayer",
        layout: {
          "icon-image": [
            "concat",
            "intensity-",
            ["to-string", ["get", "scale"]],
          ],
          "icon-size": 20 / 30, // USAGE: mapIconSizePX / imageSizePX
          "icon-allow-overlap": true,
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

    return stationCoordinates;
  } catch (error) {
    console.error("[ds/plotStations] error plotting stations: ", error);
    return [];
  }
}

export async function boundMarkers(epicenter, stationCoordinates) {
  const bounds = new mapboxgl.LngLatBounds();

  bounds.extend([epicenter.longitude, epicenter.latitude]);

  if (stationCoordinates && stationCoordinates.length > 0) {
    for (const [long, lat] of stationCoordinates) {
      bounds.extend([long, lat]);
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
