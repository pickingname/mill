import { initMap } from "./map/initMap.js";
import { config } from "./config.js";
import { fetchData } from "./fetch/fetchData.js";
import { classifyData } from "./classification/classifyData.js";
import { renderDS } from "./map/renderConditions/hypocenterReport/ds.js";
import { renderSP } from "./map/renderConditions/hypocenterReport/sp.js";
import autoTheme from "./components/themeChanger.js";
import renderFO from "./map/renderConditions/hypocenterReport/fo.js";

let currentData = [];
let previousData = [];
let currentDataType;

initMap();
autoTheme();

export async function mainLoop() {
  currentData = await fetchData(config.api.base_url);

  if (JSON.stringify(currentData) === JSON.stringify(previousData)) {
    // it's looking like nothing
    return;
  }

  console.info("[mainLoop] new data recieved");
  previousData = JSON.parse(JSON.stringify(currentData));

  currentDataType = classifyData(currentData[0].code);

  if (currentDataType === "unsupported") {
    console.warn("[mainLoop] Unsupported data type received, skipping update.");
    return;
  }

  if (currentDataType === "hypocenter_report") {
    switch (currentData[0].issue.type) {
      case "DetailScale":
        console.debug("ds");
        renderDS(currentData[0]);
        break;
      case "ScalePrompt":
        console.debug("sp");
        renderSP(currentData[0]);
        break;
      case "Destination":
        console.debug("de");
        break;
      case "Foreign":
        console.debug("fo");
        renderFO(currentData[0]);
        break;
      default:
        console.warn(`[mainLoop] bad issue type: ${currentData[0].issue.type}`);
        break;
    }
  }
}

export function startMainLoop() {
  mainLoop().then();
  setInterval(mainLoop, config.api.interval);
}
