import playSound from "../../../sound/playSound.js";
import { map, mapboxgl } from "../../initMap.js";
import { internalBound } from "../../internal/internalBound.js";

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

function updateTsunamiSidebar(areas, geojsonFeatures) {
  const gradeMap = {
    MajorWarning: {
      containerId: "tsunami-major-warning-list",
      color: "#FF00FF",
    },
    Warning: {
      containerId: "tsunami-warning-list",
      color: "#FF0000",
    },
    Watch: {
      containerId: "tsunami-watch-list",
      color: "#FFFF00",
    },
  };

  Object.values(gradeMap).forEach(({ containerId }) => {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";
  });

  const geoMap = new Map();
  geojsonFeatures.forEach((feature) => {
    geoMap.set(feature.properties.name, feature);
  });

  const grouped = { MajorWarning: [], Warning: [], Watch: [] };
  areas.forEach((area) => {
    if (grouped[area.grade]) grouped[area.grade].push(area);
  });

  Object.entries(grouped).forEach(([grade, areaList]) => {
    const { containerId, color } = gradeMap[grade];
    const container = document.getElementById(containerId);
    if (!container) return;
    if (areaList.length === 0) {
      const p = document.createElement("p");
      p.className = "text-xs text-slate-400";
      p.textContent = "No area issued.";
      container.appendChild(p);
      return;
    }
    areaList.forEach((area) => {
      const feature = geoMap.get(area.name);
      const nameEn = feature?.properties?.nameEn || area.name;
      const condition = area.firstHeight?.condition || "Unknown";
      const arrivalTime = area.firstHeight?.arrivalTime;
      const maxHeight =
        area.maxHeight?.value != null
          ? `${parseFloat(area.maxHeight.value).toFixed(1)}m`
          : "N/A";
      const row = document.createElement("div");
      row.className = `border-l-2 py-1.5 pl-3`;
      row.style.borderLeftColor = color;
      row.innerHTML = `
        <div class="flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-white">${nameEn}</p>
            <p class="text-xs text-neutral-300">${
              arrivalTime
                ? `First wave is expected to arrive at ${arrivalTime} JST`
                : condition === "第１波の到達を確認"
                ? "First wave confirmed"
                : condition === "津波到達中と推測"
                ? "Wave is expected to be reached"
                : condition === "ただちに津波来襲と予測"
                ? "Immediate tsunami expected"
                : condition
            }</p>
          </div>
          <div class="ml-2 text-right">
            <p class="text-sm font-medium text-neutral-100">${maxHeight}</p>
          </div>
        </div>
      `;
      container.appendChild(row);
    });
  });
}

export function clearAllTsAssets() {
  clearTsunamiLayers();
  disarmTsComponent();
  return;
}

export async function renderTS(data) {
  if (data.cancelled || data === "[]") {
    clearAllTsAssets();
    return;
  }
  playSound("tsReport", 0.5);
  clearTsunamiLayers();

  try {
    const response = await fetch("/assets/comparision/tsunami_areas.geojson");
    if (!response.ok) {
      console.error("[ts/renderTS] failed to fetch tsunami areas geojson");
      throw new Error(
        `[ts/renderTS] failed to fetch tsunami areas: ${response.status} ${response.statusText}`
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
          console.warn(
            `[ts/renderTS] area given not found in geojson: ${areaName}`
          );
        }
      }
    }

    if (matchedFeatures.length === 0) {
      console.warn("[ts/renderTS] no matching areas found in geojson");
      currentTsunamiBounds = null;
      disarmTsComponent();
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

    console.info(
      `[ts/renderTS] job rendered ${matchedFeatures.length} tsunami areas`
    );
    [
      "tsunami-major-warning-list",
      "tsunami-warning-list",
      "tsunami-watch-list",
    ].forEach((id) => {
      if (!document.getElementById(id)) {
        const h3 = Array.from(document.querySelectorAll("#sidebar h3")).find(
          (h) =>
            h.textContent &&
            h.textContent.includes(
              id.includes("major")
                ? "Major Warning"
                : id.includes("warning")
                ? "Warning"
                : "Watch"
            )
        );
        if (
          h3 &&
          h3.parentElement &&
          !h3.parentElement.nextElementSibling?.querySelector(`#${id}`)
        ) {
          const sect = h3.parentElement.parentElement;
          const div = document.createElement("div");
          div.id = id;
          div.className = "space-y-1";
          sect.appendChild(div);
        }
      }
    });
    updateTsunamiSidebar(data.areas || [], tsunamiAreasGeoJSON.features);
    armTsComponent();
  } catch (error) {
    console.error(
      "[ts/forecastComponent] error rendering tsunami data: ",
      error
    );
    disarmTsComponent();
  }
}

function armTsComponent() {
  document.getElementById("tsInfoContainer").classList.remove("hidden");
  document.getElementById("tsunamiContainer").classList.remove("hidden");
  document.getElementById("noInfoIssuedText").classList.add("hidden");
}

function disarmTsComponent() {
  document.getElementById("tsInfoContainer").classList.add("hidden");
  document.getElementById("tsunamiContainer").classList.add("hidden");
  document.getElementById("noInfoIssuedText").classList.remove("hidden");
}
