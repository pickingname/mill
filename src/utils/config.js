export const config = {
  map: {
    bound_padding: 100,
    bound_duration: 500,
    theme: "auto", // dawn, day, dusk, night OR 'auto'
  },
  api: {
    base_url: import.meta.env.DEV
      ? "/assets/map/testData.json"
      : "https://api.p2pquake.net/v2/history?codes=551&limit=1", // app only supports 551 codes for now
    interval: 3000,
  },
};
