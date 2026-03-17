import mapboxgl from "mapbox-gl";
import {
  intDetailSubtitleSelector,
  updateInfoBox,
} from "../../../components/infoBox/infoBoxController.js";
import { map } from "../../initMap.js";
import clear551 from "../../internal/clear551.js";
import { internalBound } from "../../internal/internalBound.js";
import playSound from "../../../sound/playSound.js";
import {
  armIntList,
  updateIntList,
} from "../../../components/infoBox/updateIntList.js";
import classifyIntensity from "../../../classification/classifyIntensity.js";

/**
 * Helper function to update the epicenter icon on the map.
 *
 * @param {*} epicenterLng Longitude of the epicenter
 * @param {*} epicenterLat Latitude of the epicenter
 */
export async function updateEpicenterIcon(epicenterLng, epicenterLat) {
  if (!map.hasImage("oldEpicenter")) {
    await new Promise((resolve, reject) => {
      map.loadImage(
        "/assets/basemap/icons/oldEpicenter.png",
        (error, image) => {
          if (error) {
            reject(error);
            return;
          }
          map.addImage("oldEpicenter", image);
          resolve();
        },
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
      "icon-image": "oldEpicenter",
      "icon-size": 30 / 31, // USAGE: mapIconSizePX / imageSizePX
    },
  });
}

/**
 * Iterate and plots the stations with it's intensity on the map.
 *
 * @param {*} data Data containing station information.
 * @returns {Promise<Array>} Returns a promise that resolves to an array of station coordinates.
 */
export async function plotStations(data, minimizedIcons = false) {
  console.log(minimizedIcons);

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
        `[ds/plotStations] failed to fetch stationRef.csv: ${response.status} ${response.statusText}`,
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
                  " using fallback",
                );
                map.loadImage(
                  "/assets/basemap/icons/intensities/invalid.png",
                  (fallbackError, fallbackImage) => {
                    if (fallbackError) {
                      console.error(
                        `[ds/plotStations] failed to load fallback icon: ${iconName} `,
                        fallbackError,
                      );
                      reject(fallbackError);
                    } else {
                      map.addImage(iconName, fallbackImage);
                      resolve();
                    }
                  },
                );
              } else {
                map.addImage(iconName, image);
                resolve();
              }
            },
          );
        });
        iconPromises.push(iconPromise);
      }
    }

    await Promise.all(iconPromises);

    if (minimizedIcons) {
      const smallIconPromises = [];
      for (const scale of [10, 20]) {
        const hasScale =
          scaleValues.has(scale) || scaleValues.has(String(scale));
        if (!hasScale) continue;
        const smallIconName = `small-intensity-${scale}`;
        if (!map.hasImage(smallIconName)) {
          smallIconPromises.push(
            new Promise((resolve) => {
              map.loadImage(
                `/assets/basemap/icons/smallIntensities/${scale}.png`,
                (error, image) => {
                  if (error) {
                    console.warn(
                      `[ds/plotStations] bad small scale image: ${scale}, `,
                      error,
                    );
                  } else {
                    map.addImage(smallIconName, image);
                  }
                  resolve();
                },
              );
            }),
          );
        }
      }
      await Promise.all(smallIconPromises);
    }

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
          `[ds/plotStations] station not found in ref data: ${point.addr}`,
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
          "icon-image": minimizedIcons
            ? [
                "case",
                ["in", ["get", "scale"], ["literal", [10, 20, "10", "20"]]],
                ["concat", "small-intensity-", ["to-string", ["get", "scale"]]],
                ["concat", "intensity-", ["to-string", ["get", "scale"]]],
              ]
            : ["concat", "intensity-", ["to-string", ["get", "scale"]]],
          "icon-size": minimizedIcons
            ? [
                "case",
                ["in", ["get", "scale"], ["literal", [10, 20, "10", "20"]]],
                1, // small icon: native 7x7px
                20 / 30, // normal icon: 20px display / 30px image
              ]
            : 20 / 30, // USAGE: mapIconSizePX / imageSizePX
          "icon-allow-overlap": true,
        },
        paint: {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
          "symbol-sort": ["get", "scale"],
          "icon-opacity": minimizedIcons
            ? [
                "case",
                ["in", ["get", "scale"], ["literal", [10, 20, "10", "20"]]],
                0.5, // <-- opacity
                1,
              ]
            : 1,
        },
      },
      "epicenterIcon",
    );

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
  const bounds = new mapboxgl.LngLatBounds();

  bounds.extend([epicenter.longitude, epicenter.latitude]);

  if (stationCoordinates && stationCoordinates.length > 0) {
    for (const [long, lat] of stationCoordinates) {
      bounds.extend([long, lat]);
    }
  } else {
    console.warn(
      "[ds] no station coordinates available for bounding, using epicenter only",
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
 * @param {Object} data The DetailScale data to render.
 * @returns {Promise<void>} Returns a promise that resolves when the DetailScale is rendered.
 * @throws {Error} Throws an error if the stationRef.csv cannot be fetched or parsed.
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
    data.earthquake.maxScale,
  );
  const epicenterLat = hyp.latitude;
  const epicenterLng = hyp.longitude;

  await updateEpicenterIcon(epicenterLng, epicenterLat);

  const minimizedIcons = ![1, 2, 3, 4, "1", "2", "3", "4"].includes(
    classifyIntensity(data.earthquake.maxScale),
  );

  const stationCoordinates = await plotStations(data, minimizedIcons);
  await boundMarkers(data.earthquake.hypocenter, stationCoordinates);
  const stationMap = await getStationMap();
  await updateIntList(data, stationMap);
  intDetailSubtitleSelector(data.issue.type);

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
