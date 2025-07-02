import {map} from "../../initMap.js";

export function updateEpicenterIcon(epicenterLng, epicenterLat) {
    if (map.getLayer('epicenterIcon')) {
        map.removeLayer('epicenterIcon');
    }
    if (map.getSource('epicenterIcon')) {
        map.removeSource('epicenterIcon');
    }

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

export async function plotStations(data) {
    if (map.getLayer('stationsLayer')) {
        map.removeLayer('stationsLayer');
    }
    if (map.getSource('stationsLayer')) {
        map.removeSource('stationsLayer');
    }

    try {
        const response = await fetch('/assets/comparision/stationRef.csv');
        if (!response.ok) {
            console.error('[ds] bad stationRef data');
        }

        const csvText = await response.text();
        const stationMap = new Map();

        const lines = csvText.trim().split('\n');
        for (let i = 0; i < lines.length; i++) {
            const [name, , , lat, long] = lines[i].split(',');
            stationMap.set(name, { lat: parseFloat(lat), long: parseFloat(long) });
        }

        const features = [];
        const iconPromises = [];
        const loadedIcons = new Set();

        const scaleValues = new Set(data.points.map(point => point.scale));

        for (const scale of scaleValues) {
            const iconName = `intensity-${scale}`;

            if (!map.hasImage(iconName) && !loadedIcons.has(iconName)) {
                loadedIcons.add(iconName);
                const iconPromise = new Promise((resolve, reject) => {
                    map.loadImage(`/assets/basemap/icons/intensities/${scale}.png`, (error, image) => {
                        if (error) {
                            console.warn(`[ds] bad scale image: ${scale}, `, error, ' using fallback');
                            map.loadImage('/assets/basemap/icons/intensities/invalid.png', (fallbackError, fallbackImage) => {
                                if (fallbackError) {
                                    console.error(`Failed to load fallback icon:`, fallbackError);
                                    reject(fallbackError);
                                } else {
                                    map.addImage(iconName, fallbackImage);
                                    resolve();
                                }
                            });
                        } else {
                            map.addImage(iconName, image);
                            resolve();
                        }
                    });
                });
                iconPromises.push(iconPromise);
            }
        }

        await Promise.all(iconPromises);

        for (const point of data.points) {
            const stationInfo = stationMap.get(point.addr);

            if (stationInfo) {
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [stationInfo.long, stationInfo.lat]
                    },
                    properties: {
                        scale: point.scale,
                        name: point.addr,
                        pref: point.pref
                    }
                });
            } else {
                console.warn(`Station not found in reference data: ${point.addr}`);
            }
        }

        map.addSource('stationsLayer', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: features
            }
        });

        map.addLayer({
            id: 'stationsLayer',
            type: 'symbol',
            source: 'stationsLayer',
            layout: {
                'icon-image': ['concat', 'intensity-', ['to-string', ['get', 'scale']]],
                'icon-size': 0.5,
                'icon-allow-overlap': true,
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Regular'],
                'text-offset': [0, 1.5],
                'text-size': 12
            },
            paint: {
                'text-color': '#000000',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1
            }
        });

    } catch (error) {
        console.error('Error plotting stations:', error);
    }
}

export function renderDS(data) {
    const epicenterLat = data.earthquake.hypocenter.latitude
    const epicenterLng = data.earthquake.hypocenter.longitude;

    updateEpicenterIcon(epicenterLng, epicenterLat);

    console.log('all points:', data.points);
    plotStations(data);
    console.log('renderDS completed');
}