import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 4177,
    strictPort: true,
    host: "127.0.0.1",
  },
});
