import { map } from "../../initMap.js";
import mapboxgl from "mapbox-gl";
import { internalBound } from "../../internal/internalBound.js";
import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";

export async function updateEpicenterIcon(epicenterLng, epicenterLat) {
  if (map.getLayer("epicenterIcon")) {
    map.removeLayer("epicenterIcon");
  }
  if (map.getSource("epicenterIcon")) {
    map.removeSource("epicenterIcon");
  }

  if (!map.hasImage("epicenter")) {
    await new Promise((resolve, reject) => {
      map.loadImage("/assets/basemap/icons/epicenter.png", (error, image) => {
        if (error) {
          reject(error);
          return;
        }
        map.addImage("epicenter", image);
        resolve();
      });
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
      "icon-size": 30 / 61, // USAGE: mapIconSizePX / imageSizePX
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
      console.error("[ds] bad stationRef data");
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
                  `[ds] bad scale image: ${scale}, `,
                  error,
                  " using fallback"
                );
                map.loadImage(
                  "/assets/basemap/icons/intensities/invalid.png",
                  (fallbackError, fallbackImage) => {
                    if (fallbackError) {
                      console.error(
                        `[ds] failed to load fallback icon: ${iconName} `,
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
      } else {
        console.warn(`[ds] station not found in ref data: ${point.addr}`);
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
          "icon-size": 25 / 300, // USAGE: mapIconSizePX / imageSizePX
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
  } catch (error) {
    console.error("[ds] error plotting stations: ", error);
  }
}

export async function boundMarkers(epicenter, stations) {
  const bounds = new mapboxgl.LngLatBounds();

  bounds.extend([epicenter.longitude, epicenter.latitude]);

  const response = await fetch("/assets/comparision/stationRef.csv");
  if (!response.ok) {
    console.error("[ds] bad stationRef data for bounding");
    return;
  }
  const csvText = await response.text();
  const stationMap = new Map();
  const lines = csvText.trim().split("\n");
  for (let i = 1; i < lines.length; i++) {
    const [name, , , lat, long] = lines[i].split(",");
    stationMap.set(name, { lat: parseFloat(lat), long: parseFloat(long) });
  }

  for (const station of stations) {
    const stationInfo = stationMap.get(station.addr);
    if (stationInfo) {
      bounds.extend([stationInfo.long, stationInfo.lat]);
    }
  }

  internalBound(bounds);
}

export async function renderDS(data) {
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

  await updateEpicenterIcon(epicenterLng, epicenterLat);

  await plotStations(data);
  await boundMarkers(data.earthquake.hypocenter, data.points);
  console.log("[ds] renderDS completed");
}
