import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      manifest: false, // We already have a static manifest in public/
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg}']
      }
    })
  ],
  server: {
    host: true,
    hmr: {
      clientPort: 5173,
    },
  },
});
