import { getCanonValidationSummary } from "../src/utils/canon.js";

const summary = await getCanonValidationSummary();

const routeCount = summary.routeDocs.length;
const characterCount = summary.characterEntries.length;

console.log(`Canon validation: ${routeCount} routes, ${characterCount} characters.`);
summary.routeDocs.forEach(({ route, docs }) => {
  console.log(`- ${route}: ${docs.length} doc(s)`);
});
