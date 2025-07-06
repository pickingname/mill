import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import clear551 from "../../internal/clear551";
import { internalBound } from "../../internal/internalBound";
import { updateEpicenterIcon } from "./ds";
import mapboxgl from "mapbox-gl";

export async function boundEpicenter(epicenterLng, epicenterLat) {
  const bounds = new mapboxgl.LngLatBounds();
  bounds.extend([epicenterLng, epicenterLat]);
  internalBound(bounds);
}

export default async function renderFO(data) {
  clear551();

  const hyp = data.earthquake.hypocenter;

  const epicenterLat = hyp.latitude;
  const epicenterLng = hyp.longitude;

  await updateEpicenterIcon(epicenterLng, epicenterLat);
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
