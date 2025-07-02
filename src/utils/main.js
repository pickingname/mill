import {initMap} from "./map/initMap.js";
import {config} from "./config.js";
import {fetchData} from "./fetch/fetchData.js";

let currentData = []
let currentDataType;

initMap();

export async function mainLoop() {
    currentData = await fetchData(config.api.base_url);
    console.log(currentData)
}

export function startMainLoop() {
    mainLoop().then(() => {

    });
    setInterval(mainLoop, config.api.interval); // 60 FPS
}