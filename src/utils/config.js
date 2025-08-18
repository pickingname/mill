/**
 * Global/Main configuration object.
 *
 * @typedef {Object} Config
 * @property {Object} map Map configurations.
 * @property {Array<Array<number>>} map.main_bounds Main bounds for the map (geojson like).
 * @property {number} map.bound_padding Padding for map bounds in pixels.
 * @property {number} map.bound_duration Duration for map bounds animation used in internalBound().
 * @property {string} map.theme Theme for the map ('auto', 'dawn', 'day', 'dusk', 'night').
 *
 * @property {Object} api API configurations.
 * @property {string} api.base_url URL used to fetch p2pquake earthquake data.
 * @property {number} api.interval Interval for fetching p2pquake earthquake data. Rate limited to 60 requests per minute.
 * @property {string} api.jmaTsunamiURL URL used to fetch p2pquake tsunami data.
 * @property {number} api.jmaTsunamiInterval Interval for fetching p2pquake tsunami data. Rate limited to 10 requests per minute.
 *
 */
export const config = {
  map: {
    bound_padding: 100,
    bound_duration: 500,
    theme: "dawn",
    main_bounds: [
      [122.778834, 23.927012],
      [149.367464, 23.927012],
      [149.367464, 45.606257],
      [122.778834, 45.606257],
      [122.778834, 23.927012],
    ],
  },
  api: {
    base_url: import.meta.env.DEV
      ? "/assets/map/testData.json"
      : "https://api.p2pquake.net/v2/history?codes=551&limit=1", // 60 リクエスト/分 (IP アドレス毎)
    interval: 5000,

    jmaTsunamiURL: import.meta.env.DEV
      ? "/assets/map/testTsData.json"
      : "https://api.p2pquake.net/v2/jma/tsunami?limit=1",
    jmaTsunamiInterval: 10000,
  },
};
