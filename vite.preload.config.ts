import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        "better-sqlite3",
        "lightningcss-win32-x64-msvc",
        "lightningcss-darwin-arm64",
      ],
    },
  },
});
