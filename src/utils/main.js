import {initMap} from "./map/initMap.js";
import {config} from "./config.js";
import {fetchData} from "./fetch/fetchData.js";
import {classifyData} from "./classification/classifyData.js";
import {renderDS} from "./map/renderConditions/hypocenterReport/ds.js";

let currentData = []
let previousData = []
let currentDataType;

initMap();

export async function mainLoop() {
    currentData = await fetchData(config.api.base_url);

    if (JSON.stringify(currentData) === JSON.stringify(previousData)) {
        // it's looking like nothing
        return;
    }

    console.info('[mainLoop] new data recieved')
    previousData = JSON.parse(JSON.stringify(currentData));

    currentDataType = classifyData(currentData[0].code);

    if (currentDataType === 'unsupported') {
        console.warn('[mainLoop] Unsupported data type received, skipping update.');
        return;
    }

    if (currentDataType === 'hypocenter_report') {
        switch (currentData[0].issue.type) {
            case 'DetailScale':
                console.log('ds')
                renderDS(currentData[0])
                break;
            case 'ScalePrompt':
                console.log('sp')
                break;
            case 'Destination':
                console.log('de')
                break;
            case 'Foreign':
                console.log('fo')
                break;
            default:
                console.warn(`[mainLoop] bad issue type: ${currentData[0].issue.type}`);
                break;
        }
    }
}

export function startMainLoop() {
    mainLoop().then()
    setInterval(mainLoop, config.api.interval);
}