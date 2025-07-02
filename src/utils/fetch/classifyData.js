export function classifyData(code) {
    switch (code) {
        case 551:
            return 'hypocenter_report'; // normal case
        case 552:
            return 'tsunami_forecast'; // special case
        case 554:
            return 'pre_EEW'; // special warning
        case 556:
            return 'EEW'; // special warning
        case 561:
            return 'earthquake_detection' // special case
        default:
            return 'unsupported'
    }
}