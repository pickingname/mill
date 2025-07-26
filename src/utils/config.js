export const config = {
  map: {
    bound_padding: 100,
    bound_duration: 500,
    theme: "auto", // dawn, day, dusk, night OR 'auto'
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
      : "https://api.p2pquake.net/v2/jma/tsunami?limit=1", // 10 リクエスト/分 (IP アドレス毎)
    jmaTsunamiInterval: 10000,
  },
};
