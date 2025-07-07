import { map, mapboxgl } from "../../initMap.js";
import { internalBound } from "../../internal/internalBound.js";
import clear551 from "../../internal/clear551.js";

let tsunamiFlashInterval = null;
let tsunamiFlashTimeout = null;

let currentTsunamiBounds = null;
export function getTsunamiBounds() {
  return currentTsunamiBounds;
}

function clearTsunamiLayers() {
  if (tsunamiFlashInterval) {
    clearInterval(tsunamiFlashInterval);
    tsunamiFlashInterval = null;
  }
  if (tsunamiFlashTimeout) {
    clearTimeout(tsunamiFlashTimeout);
    tsunamiFlashTimeout = null;
  }
  if (map.getLayer("tsunamiAreas")) {
    map.removeLayer("tsunamiAreas");
  }
  if (map.getSource("tsunamiAreas")) {
    map.removeSource("tsunamiAreas");
  }
  currentTsunamiBounds = null;
}

export async function renderTS(data) {
  if (data.cancelled) {
    clearTsunamiLayers();
    return;
  }
  clear551();
  clearTsunamiLayers();

  try {
    const response = await fetch("/assets/comparision/tsunami_areas.geojson");
    if (!response.ok) {
      console.error("[ts] failed to fetch tsunami areas geojson");
      throw new Error(
        `[ts] failed to fetch tsunami areas: ${response.status} ${response.statusText}`
      );
    }

    const tsunamiAreasGeoJSON = await response.json();

    const areaNameMap = new Map();
    tsunamiAreasGeoJSON.features.forEach((feature) => {
      const name = feature.properties.name;
      areaNameMap.set(name, feature);
    });

    const matchedFeatures = [];
    const bounds = new mapboxgl.LngLatBounds();

    if (data.areas && Array.isArray(data.areas)) {
      for (const area of data.areas) {
        const areaName = area.name;
        const grade = area.grade;

        const geoJSONFeature = areaNameMap.get(areaName);

        if (geoJSONFeature) {
          const feature = {
            ...geoJSONFeature,
            properties: {
              ...geoJSONFeature.properties,
              grade: grade,
              maxHeight: area.maxHeight?.description || "Unknown",
              firstHeight: area.firstHeight?.condition || "Unknown",
            },
          };

          matchedFeatures.push(feature);

          if (geoJSONFeature.geometry.type === "LineString") {
            geoJSONFeature.geometry.coordinates.forEach((coord) => {
              bounds.extend(coord);
            });
          } else if (geoJSONFeature.geometry.type === "MultiLineString") {
            geoJSONFeature.geometry.coordinates.forEach((line) => {
              line.forEach((coord) => {
                bounds.extend(coord);
              });
            });
          }
        } else {
          console.warn(`[ts] area given not found in geojson: ${areaName}`);
        }
      }
    }

    if (matchedFeatures.length === 0) {
      console.warn("[ts] no matching areas found in geojson");
      currentTsunamiBounds = null;
      return;
    }

    map.addSource("tsunamiAreas", {
      type: "geojson",
      tolerance: 0,
      data: {
        type: "FeatureCollection",
        features: matchedFeatures,
      },
    });

    map.addLayer({
      id: "tsunamiAreas",
      type: "line",
      source: "tsunamiAreas",
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "grade"], "Watch"],
          "#ffff00",
          ["==", ["get", "grade"], "Warning"],
          "#ff0000",
          ["==", ["get", "grade"], "MajorWarning"],
          "#ff00ff",
          "#707070",
        ],
        "line-width": 2,
        "line-opacity": 1,
        "line-emissive-strength": 1,
      },
    });

    if (tsunamiFlashInterval) {
      clearInterval(tsunamiFlashInterval);
      tsunamiFlashInterval = null;
    }
    if (tsunamiFlashTimeout) {
      clearTimeout(tsunamiFlashTimeout);
      tsunamiFlashTimeout = null;
    }
    let visible = true;
    function setTsunamiLayerVisibility(vis) {
      if (map.getLayer("tsunamiAreas")) {
        map.setLayoutProperty(
          "tsunamiAreas",
          "visibility",
          vis ? "visible" : "none"
        );
      }
    }
    setTsunamiLayerVisibility(true);
    tsunamiFlashInterval = setInterval(() => {
      setTsunamiLayerVisibility(false);
      tsunamiFlashTimeout = setTimeout(() => {
        setTsunamiLayerVisibility(true);
      }, 500);
    }, 1500);

    const areaCount = matchedFeatures.length;
    const highestGrade = Math.max(
      ...matchedFeatures.map((f) => {
        const grade = f.properties.grade;
        switch (grade) {
          case "MajorWarning":
            return 3;
          case "Warning":
            return 2;
          case "Watch":
            return 1;
          default:
            return 0;
        }
      })
    );

    let gradeText = "Watch";
    if (highestGrade === 3) gradeText = "Major Warning";
    else if (highestGrade === 2) gradeText = "Warning";

    if (!bounds.isEmpty()) {
      currentTsunamiBounds = bounds;
      internalBound(bounds);
    } else {
      currentTsunamiBounds = null;
    }

    console.log(`[ts] job rendered ${matchedFeatures.length} tsunami areas`);
  } catch (error) {
    console.error("[ts] error rendering tsunami data: ", error);
  }
}
