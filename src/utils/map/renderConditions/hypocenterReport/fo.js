import { leaflet } from "../../initMap.js";
import { updateInfoBox } from "../../../components/infoBox/infoBoxController.js";
import clear551 from "../../internal/clear551.js";
import { updateEpicenterIcon } from "./ds.js";
import playSound from "../../../sound/playSound.js";
import { disarmIntList } from "../../../components/infoBox/updateIntList.js";
import { config } from "../../../config.js";
import { map } from "../../initMap.js";

export async function boundEpicenter(epicenterLng, epicenterLat) {
  const bounds = leaflet.latLngBounds([]);
  bounds.extend([epicenterLat, epicenterLng]);
  
  for (const coord of config.map.main_bounds) {
    bounds.extend([coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
  }

  map.fitBounds(bounds, {
    padding: [config.map.bound_padding, config.map.bound_padding],
    animate: true,
    duration: config.map.bound_duration / 1000
  });
}

export default async function renderFO(data) {
  playSound("detailScale", 0.5);
  clear551();
  disarmIntList();

  const hyp = data.earthquake.hypocenter;

  const epicenterLat = hyp.latitude;
  const epicenterLng = hyp.longitude;

  await updateEpicenterIcon(epicenterLng, epicenterLat, "epicenter");
  await boundEpicenter(epicenterLng, epicenterLat);

  updateInfoBox(
    "Foreign Earthquake Report",
    hyp.name,
    hyp.magnitude,
    hyp.depth,
    data.earthquake.time,
    data.comments.freeFormComment,
    data.earthquake.maxScale
  );
}
