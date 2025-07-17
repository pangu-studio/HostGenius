import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@tailwindcss/oxide",
      "lightningcss-darwin-arm64",
      "lightningcss-darwin-x64",
      "lightningcss-win32-x64-msvc",
      "lightningcss-linux-x64-gnu",
      "lightningcss-linux-arm64-gnu",
    ],
  },
  build: {
    rollupOptions: {
      external: [
        "@tailwindcss/oxide",
        "lightningcss-darwin-arm64",
        "lightningcss-darwin-x64",
        "lightningcss-win32-x64-msvc",
        "lightningcss-linux-x64-gnu",
        "lightningcss-linux-arm64-gnu",
      ],
    },
  },
});
