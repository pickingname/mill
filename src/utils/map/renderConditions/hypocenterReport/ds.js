import {map} from "../../initMap.js";

export function updateEpicenterIcon(epicenterLng, epicenterLat) {
    // Remove previous layer and source if they exist
    if (map.getLayer('epicenterIcon')) {
        map.removeLayer('epicenterIcon');
    }
    if (map.getSource('epicenterIcon')) {
        map.removeSource('epicenterIcon');
    }

    // Check if the image is already added
    if (!map.hasImage('epicenter')) {
        map.loadImage('/assets/basemap/icons/epicenter.png', (error, image) => {
            if (error) throw error;
            map.addImage('epicenter', image, {pixelRatio: 1});
            addEpicenterLayer();
        });
    } else {
        addEpicenterLayer();
    }

    function addEpicenterLayer() {
        map.addSource('epicenterIcon', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [epicenterLng, epicenterLat]
                    }
                }]
            }
        });

        map.addLayer({
            id: 'epicenterIcon',
            type: 'symbol',
            source: 'epicenterIcon',
            layout: {
                'icon-image': 'epicenter',
                'icon-size': 30 / 61 // USAGE: mapIconSizePX / imageSizePX
            }
        });
    }
}

export function renderDS(data) {
    const epicenterLat = data.earthquake.hypocenter.latitude
    const epicenterLng = data.earthquake.hypocenter.longitude;

    updateEpicenterIcon(epicenterLng, epicenterLat);

}