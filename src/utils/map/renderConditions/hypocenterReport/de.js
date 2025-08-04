import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import { disarmIntList } from "../../../components/infoBox/updateIntList";
import playSound from "../../../sound/playSound";
import clear551 from "../../internal/clear551";
import { updateEpicenterIcon } from "./ds";
import { boundEpicenter } from "./fo";

/**
 * A part of the main rendering logic for Destination (DE) on response code 551.
 *
 * Renders the Epicenter Destination data on the map and updates the information box and sidebar.
 *
 * Includes:
 * - Clearing previous plotted data
 * - Epicenter icon update
 * - Epicenter bounding
 * - Information box update
 *
 * @param {Object} data - The earthquake data to render.
 * @returns {Promise<void>} Returns a promise that resolves when the Destination is rendered.
 */
export async function renderDE(data) {
  playSound("detailScale", 0.5);
  clear551();
  disarmIntList();

  const hyp = data.earthquake.hypocenter;

  const epicenterLat = hyp.latitude;
  const epicenterLng = hyp.longitude;

  await updateEpicenterIcon(epicenterLng, epicenterLat);
  await boundEpicenter(epicenterLng, epicenterLat);

  updateInfoBox(
    "Epicenter Confirmation",
    hyp.name,
    hyp.magnitude,
    hyp.depth,
    data.earthquake.time,
    data.comments.freeFormComment,
    data.earthquake.maxScale
  );
}
