import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  integrations: [react()],
});
