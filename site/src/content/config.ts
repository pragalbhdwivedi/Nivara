import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const nivaraPages = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: new URL("../../../docs/nivara", import.meta.url),
  }),
});

const characters = defineCollection({
  loader: glob({
    pattern: "**/README.md",
    base: new URL("../../../docs/nivara/characters", import.meta.url),
  }),
});

const symbols = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: new URL("../../../docs/nivara/symbols", import.meta.url),
  }),
});

export const collections = {
  nivara_pages: nivaraPages,
  characters,
  symbols,
};
