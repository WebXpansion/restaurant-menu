import { defineConfig } from "vite";

export default defineConfig({
  root: "public",
  build: {
    outDir: "../public-dist",
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
