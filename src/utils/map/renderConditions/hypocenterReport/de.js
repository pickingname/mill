import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import { disarmIntList } from "../../../components/infoBox/updateIntList";
import playSound from "../../../sound/playSound";
import clear551 from "../../internal/clear551";
import { updateEpicenterIcon } from "./ds";
import { boundEpicenter } from "./fo";

export async function renderDE(data) {
  playSound("detailScale", 0.5);
  clear551();
  disarmIntList();

  const hyp = data.earthquake.hypocenter;

  const epicenterLat = hyp.latitude;
  const epicenterLng = hyp.longitude;

  await updateEpicenterIcon(epicenterLng, epicenterLat, "epicenter");
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
