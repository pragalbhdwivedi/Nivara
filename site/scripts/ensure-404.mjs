import fs from "node:fs/promises";
import path from "node:path";

const distRoot = path.resolve(new URL("../dist", import.meta.url).pathname);
const source = path.join(distRoot, "404", "index.html");
const target = path.join(distRoot, "404.html");

try {
  await fs.access(source);
} catch (error) {
  console.warn("No 404/index.html found to copy.");
  process.exit(0);
}

await fs.copyFile(source, target);
console.log("Copied 404/index.html to 404.html for GitHub Pages.");
