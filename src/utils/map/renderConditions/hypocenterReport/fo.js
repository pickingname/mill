import { L } from "../../initMap.js";
import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import clear551 from "../../internal/clear551";
import { updateEpicenterIcon } from "./ds";
import playSound from "../../../sound/playSound";
import { disarmIntList } from "../../../components/infoBox/updateIntList";
import { config } from "../../../config";
import { map } from "../../initMap";

/**
 * Custom epicenter / bounding function for Foreign reports.
 * This was different from the internalBound function due to this one not having maxZoom.
 *
 * @param {number} epicenterLng
 * @param {number} epicenterLat
 */
export async function boundEpicenter(epicenterLng, epicenterLat) {
  const bounds = L.latLngBounds();
  bounds.extend([epicenterLat, epicenterLng]);
  
  // Convert the main bounds coordinates (lng, lat) to (lat, lng) for Leaflet
  for (const coord of config.map.main_bounds) {
    bounds.extend([coord[1], coord[0]]); // swap lng,lat to lat,lng
  }

  const paddingOptions = {
    padding: [config.map.bound_padding, config.map.bound_padding]
  };

  if (config.map.bound_duration > 0) {
    paddingOptions.animate = true;
    paddingOptions.duration = config.map.bound_duration / 1000; // Convert to seconds
  }

  map.fitBounds(bounds, paddingOptions);
}
/**
 * A part of the main rendering logic for Foreign report (FO) on response code 551.
 *
 * Renders the Foreign report data on the map and updates the information box and sidebar.
 *
 * Includes:
 * - Clearing previous plotted data
 * - Epicenter icon update
 * - Epicenter bounding
 * - Information box update
 *
 * @param {*} data
 */
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
