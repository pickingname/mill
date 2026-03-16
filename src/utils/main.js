import { classifyData } from "./classification/classifyData.js";
import { showSidebar } from "./components/sidebarHandler.js";
import autoTheme from "./components/themeChanger.js";
import { config } from "./config.js";
import { fetchData } from "./fetch/fetchData.js";
import { initMap } from "./map/initMap.js";
import renderEEW from "./map/renderConditions/eew/eew.js";
import { renderDE } from "./map/renderConditions/hypocenterReport/de.js";
import { renderDS } from "./map/renderConditions/hypocenterReport/ds.js";
import renderFO from "./map/renderConditions/hypocenterReport/fo.js";
import { renderSP } from "./map/renderConditions/hypocenterReport/sp.js";
import {
  clearAllTsAssets,
  renderTS,
} from "./map/renderConditions/tsunami_forecast/ts.js";
import { renderYahooEEW } from "./map/renderConditions/yahooEEW/renderYahooEEW.js";

let currentData = [];
let previousData = [];
let currentTsunamiData = [];
let previousTsunamiData = [];
let currentEEWData = [];
let previousEEWData = [];

let currentDataType;

initMap();
autoTheme();
showSidebar();

/**
 * This main loop fetches data from the API and renders it based on the data type.
 *
 * @returns {Promise<void>} Returns a promise that resolves when the main loop completes.
 */
export async function mainLoop() {
  currentData = await fetchData(config.api.baseURL);

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
        console.info("[mainLoop] received DetailScale");
        renderDS(currentData[0]);
        break;
      case "ScalePrompt":
        console.info("[mainLoop] received ScalePrompt");
        renderSP(currentData[0]);
        break;
      case "Destination":
        console.info("[mainLoop] received Destination");
        renderDE(currentData[0]);
        break;
      case "Foreign":
        console.info("[mainLoop] received Foreign");
        renderFO(currentData[0]);
        break;
      default:
        console.warn(`[mainLoop] bad issue type: ${currentData[0].issue.type}`);
        break;
    }
  } else if (currentDataType === "eew") {
    console.info("[mainLoop] received EEW");
    renderEEW(currentData[0]);
  }
}

/**
 * This secondary loop fetches tsunami data (from /jma endpoints) and updates the map if available.
 *
 * @returns {Promise<void>} Returns a promise that resolves when the data fetching and rendering is complete or when there is no new data.
 */
export async function tsFetchLoop() {
  currentTsunamiData = await fetchData(config.api.jmaTsunamiURL);
  if (
    JSON.stringify(currentTsunamiData) === JSON.stringify(previousTsunamiData)
  ) {
    // it's looking like nothing
    return;
  }

  previousTsunamiData = JSON.parse(JSON.stringify(currentTsunamiData));

  if (currentTsunamiData.length > 0) {
    renderTS(currentTsunamiData[0]);
  } else {
    clearAllTsAssets();
  }
}

/**
 * This tertiary loop fetches EEW data and updates the map if available.
 *
 * @returns {Promise<void>} Returns a promise that resolves when the data fetching and rendering is complete or when there is no new data.
 */
export async function eewLoop() {
  currentEEWData = await fetchData(config.api.eewURL);

  previousEEWData = JSON.parse(JSON.stringify(currentEEWData));
  renderYahooEEW(currentEEWData);
}

/**
 * This function starts the main loop and sets up intervals for data fetching.
 *
 * @returns {void}
 */
export function startMainLoop() {
  mainLoop().then();
  setInterval(mainLoop, config.api.interval);

  tsFetchLoop().then();
  setInterval(tsFetchLoop, config.api.jmaTsunamiInterval);

  eewLoop().then();
  setInterval(eewLoop, config.api.eewInterval);
}
