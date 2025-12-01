import { loadEnv } from "../src/config/env.js";
import { runDailyPipeline } from "../src/pipeline.js";

// Load environment and run pipeline immediately
loadEnv();
runDailyPipeline()
  .then(() => {
    console.log("\n✓ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  });
