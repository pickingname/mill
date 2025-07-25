import classifyIntensity from "../../classification/classifyIntensity.js";

const intListParent = document.getElementById("intListParent");

export function armIntList() {
  intListParent.classList.remove("hidden");
}

export function disarmIntList() {
  intListParent.classList.add("hidden");
}

function haversineDistance(coords1, coords2) {
  function toRad(x) {
    return (x * Math.PI) / 180;
  }

  const R = 6371;
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function updateIntList(data, stationMap) {
  const epicenterCoords = {
    lat: data.earthquake.hypocenter.latitude,
    lon: data.earthquake.hypocenter.longitude,
  };

  const intensityGroups = {
    7: [],
    "6+": [],
    "6-": [],
    "5+": [],
    "5-": [],
    4: [],
    3: [],
    2: [],
    1: [],
    "Invalid Intensity": [],
  };

  for (const point of data.points) {
    const intensity = classifyIntensity(point.scale);
    const stationInfo = stationMap.get(point.addr);
    if (stationInfo) {
      const distance = haversineDistance(epicenterCoords, {
        lat: stationInfo.lat,
        lon: stationInfo.long,
      });
      if (intensityGroups[intensity]) {
        intensityGroups[intensity].push({
          name: point.addr,
          distance: distance.toFixed(0),
        });
      }
    }
  }

  const intListContainer = document.getElementById("intListContainer");
  intListContainer.innerHTML = ""; // Clear existing list

  const intensityOrder = [
    "7",
    "6+",
    "6-",
    "5+",
    "5-",
    "4",
    "3",
    "2",
    "1",
    "Invalid Intensity",
  ];
  const intensityClassMap = {
    7: "int7",
    "6+": "int6U",
    "6-": "int6L",
    "5+": "int5U",
    "5-": "int5L",
    4: "int4",
    3: "int3",
    2: "int2",
    1: "int1",
    "Invalid Intensity": "slate-300",
  };

  for (const intensity of intensityOrder) {
    const points = intensityGroups[intensity];
    if (points.length > 0) {
      points.sort((a, b) => a.distance - b.distance);

      const intensityContainer = document.createElement("div");
      intensityContainer.className = "space-y-2 mb-2";

      const header = document.createElement("div");
      header.className = "flex items-center gap-2";
      header.innerHTML = `<h3 class="text-lg font-medium text-neutral-300 tabular-nums">${intensity}</h3>`;
      intensityContainer.appendChild(header);

      const itemsContainer = document.createElement("div");
      itemsContainer.className = "space-y-1";

      const createPointElement = (point) => {
        const item = document.createElement("div");
        item.className = `border-l-2 py-1.5 pl-3 border-l-${intensityClassMap[intensity]}`;
        item.innerHTML = `
          <div class="flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-neutral-100">${point.name}</p>
            </div>
            <div class="ml-2 text-right">
              <p class="text-sm text-neutral-100">
                <span>${point.distance}</span> km
              </p>
            </div>
          </div>
        `;
        return item;
      };

      if (points.length > 4) {
        for (let i = 0; i < 4; i++) {
          itemsContainer.appendChild(createPointElement(points[i]));
        }

        const showMoreContainer = document.createElement("div");
        showMoreContainer.className = "pl-3 pt-1";
        const showMoreButton = document.createElement("button");
        showMoreButton.className = "text-sm text-blue-400 hover:underline";
        showMoreButton.textContent = `Show ${points.length - 4} more...`;

        showMoreButton.onclick = () => {
          for (let i = 4; i < points.length; i++) {
            itemsContainer.insertBefore(
              createPointElement(points[i]),
              showMoreContainer
            );
          }
          showMoreContainer.remove();
        };

        showMoreContainer.appendChild(showMoreButton);
        itemsContainer.appendChild(showMoreContainer);
      } else {
        for (const point of points) {
          itemsContainer.appendChild(createPointElement(point));
        }
      }

      intensityContainer.appendChild(itemsContainer);
      intListContainer.appendChild(intensityContainer);
    }
  }
}
