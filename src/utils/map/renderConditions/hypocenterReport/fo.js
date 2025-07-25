import mapboxgl from "mapbox-gl";
import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import clear551 from "../../internal/clear551";
import { updateEpicenterIcon } from "./ds";
import playSound from "../../../sound/playSound";
import { disarmIntList } from "../../../components/infoBox/updateIntList";
import { config } from "../../../config";
import { map } from "../../initMap";

export async function boundEpicenter(epicenterLng, epicenterLat) {
  const bounds = new mapboxgl.LngLatBounds();
  bounds.extend([epicenterLng, epicenterLat]);
  for (const coord of config.map.main_bounds) {
    bounds.extend(coord); // Extend for each [lng, lat] pair
  }

  map.fitBounds(bounds, {
    padding: config.map.bound_padding,
    duration: config.map.bound_duration,
    easing: (t) => 1 - Math.pow(1 - t, 5),
    linear: true,
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
