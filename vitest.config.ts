import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  cacheDir: "./.vitest-cache",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
