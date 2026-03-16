import { map } from "../../initMap.js";

function parseCoordinate(coordStr) {
  if (!coordStr) return 0;
  const direction = coordStr.charAt(0);
  const value = parseFloat(coordStr.substring(1));
  return direction === "S" || direction === "W" ? -value : value;
}

function createGeoJSONCircle(center, radiusInKm, points = 64) {
  const coords = [];
  const R = 6371.0087714;
  const d = radiusInKm / R;
  const lat1 = (center[1] * Math.PI) / 180;
  const lon1 = (center[0] * Math.PI) / 180;

  for (let i = 0; i <= points; i++) {
    const brng = ((i * 360) / points) * (Math.PI / 180);
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
        Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      );
    coords.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

function removeLayerAndSource(id) {
  if (map.getLayer(id)) {
    map.removeLayer(id);
  }
  if (map.getSource(id)) {
    map.removeSource(id);
  }
}

export async function renderYahooEEW(eewData) {
  if (!eewData || !eewData.psWave || !eewData.hypoInfo) {
    return;
  }

  const psWaveItem = eewData.psWave.items?.[0];
  const hypoItem = eewData.hypoInfo.items?.[0];

  if (!psWaveItem || !hypoItem) {
    return;
  }

  const epicenterLat = parseCoordinate(hypoItem.latitude);
  const epicenterLng = parseCoordinate(hypoItem.longitude);
  const center = [epicenterLng, epicenterLat];

  const pRadius = parseFloat(psWaveItem.pRadius);
  const sRadius = parseFloat(psWaveItem.sRadius);

  removeLayerAndSource("yahoo-eew-pwave");
  removeLayerAndSource("yahoo-eew-swave");
  removeLayerAndSource("yahoo-eew-epicenter");

  // Pw
  if (!isNaN(pRadius) && pRadius > 0) {
    map.addSource("yahoo-eew-pwave", {
      type: "geojson",
      data: createGeoJSONCircle(center, pRadius),
    });
    map.addLayer({
      id: "yahoo-eew-pwave",
      type: "line",
      source: "yahoo-eew-pwave",
      paint: {
        "line-color": "#35b4fb",
        "line-width": 1,
        "line-emissive-strength": 1,
      },
    });
  }

  // Sw
  if (!isNaN(sRadius) && sRadius > 0) {
    map.addSource("yahoo-eew-swave", {
      type: "geojson",
      data: createGeoJSONCircle(center, sRadius),
    });
    map.addLayer({
      id: "yahoo-eew-swave",
      type: "line",
      source: "yahoo-eew-swave",
      paint: {
        "line-color": "#f6521f",
        "line-width": 1,
        "line-emissive-strength": 1,
      },
    });
  }

  if (!map.hasImage("epicenter")) {
    await new Promise((resolve) => {
      map.loadImage("/assets/basemap/icons/epicenter.png", (error, image) => {
        if (error) {
          console.error(
            "[renderYahooEEW] Failed to load epicenter icon",
            error,
          );
          resolve();
          return;
        }
        map.addImage("epicenter", image);
        resolve();
      });
    });
  }

  map.addSource("yahoo-eew-epicenter", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: center,
      },
    },
  });

  map.addLayer({
    id: "yahoo-eew-epicenter",
    type: "symbol",
    source: "yahoo-eew-epicenter",
    layout: {
      "icon-image": map.hasImage("epicenter") ? "epicenter" : "",
      "icon-size": 30 / 31,
      "icon-allow-overlap": true,
    },
  });
}
