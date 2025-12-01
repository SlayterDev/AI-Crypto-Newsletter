import { clearCache } from "./src/utils/cache.js";

console.log("Clearing cache...");
const deletedCount = clearCache();

if (deletedCount > 0) {
  console.log(`✓ Successfully cleared ${deletedCount} cached file(s)`);
} else {
  console.log("No cached files to clear");
}
