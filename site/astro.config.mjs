import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  base: "/",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  integrations: [react()],
});
