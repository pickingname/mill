import { defineConfig } from "vite";

export default defineConfig({
  server: {
    allowedHosts: ["0.tcp.ap.ngrok.io", ".ngrok.io", ".ngrok-free.app"],
    host: true,
  },
  plugins: [
    {
      // IMPORTANT! this fixes an issue where editing JS files only triggers a CSS HMR update
      name: "cssReloadFix",
      handleHotUpdate({ file, server }) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          server.ws.send({
            type: "full-reload",
            path: "*",
          });
        }
      },
    },
  ],
});
