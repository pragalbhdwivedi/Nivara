import fs from "node:fs/promises";
import path from "node:path";
import { getCanonValidationSummary, readCanonFrontmatter } from "../src/utils/canon.js";

const summary = await getCanonValidationSummary();

const routeCount = summary.routeDocs.length;
const characterCount = summary.characterEntries.length;
const publicRoot = path.resolve(new URL("../public", import.meta.url).pathname);

console.log(`Canon validation: ${routeCount} routes, ${characterCount} characters.`);
summary.routeDocs.forEach(({ route, docs }) => {
  console.log(`- ${route}: ${docs.length} doc(s)`);
});

const ensureLocalAsset = async (assetPath, sourcePath) => {
  if (!assetPath) {
    return;
  }
  if (assetPath.startsWith("http")) {
    throw new Error(`Remote asset detected in ${sourcePath}: ${assetPath}`);
  }
  if (!assetPath.startsWith("/")) {
    throw new Error(`Asset paths must be absolute (start with /) in ${sourcePath}: ${assetPath}`);
  }
  const resolved = path.join(publicRoot, assetPath);
  try {
    await fs.access(resolved);
  } catch (error) {
    throw new Error(`Missing asset for ${sourcePath}: ${assetPath}`);
  }
};

const validateFrontmatterAssets = async (docPath) => {
  const data = await readCanonFrontmatter(docPath);
  const assetFields = ["cover_image", "background_image", "overlay_image", "profile_image"];
  for (const field of assetFields) {
    await ensureLocalAsset(data?.[field], docPath);
  }
  if (Array.isArray(data?.gallery)) {
    for (const entry of data.gallery) {
      await ensureLocalAsset(entry, docPath);
    }
  }
};

for (const { docs } of summary.routeDocs) {
  for (const docPath of docs) {
    await validateFrontmatterAssets(docPath);
  }
}

for (const entry of summary.characterEntries) {
  await validateFrontmatterAssets(entry.filePath);
}

console.log("Asset validation complete.");
