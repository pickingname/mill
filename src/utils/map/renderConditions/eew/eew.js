import { updateInfoBox } from "../../../components/infoBox/infoBoxController";
import clear551 from "../../internal/clear551";
import { updateEpicenterIcon } from "../hypocenterReport/ds";
import { boundEpicenter } from "../hypocenterReport/fo";

export default async function renderEEW(data) {
  clear551();

  const hyp = data.earthquake.hypocenter;

  const epicenterLat = hyp.latitude;
  const epicenterLng = hyp.longitude;

  await updateEpicenterIcon(epicenterLng, epicenterLat);
  await boundEpicenter(epicenterLng, epicenterLat);

  updateInfoBox(
    "Earthquake Early Warning",
    hyp.name,
    hyp.magnitude,
    hyp.depth,
    data.earthquake.originTime,
    "",
    "--"
  );
}
