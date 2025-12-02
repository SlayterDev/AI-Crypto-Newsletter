/**
 * Example: Testing Pipeline with Mock Adapters
 *
 * Demonstrates how to run the pipeline with mock adapters
 * for testing without making actual API calls or sending emails.
 */

import { runDailyPipeline } from "../src/pipeline.js";
import { getMockAdapters } from "../src/tests/fixtures/mockAdapters.js";
import { loadEnv } from "../src/config/env.js";

// Load environment (for COINS config, etc.)
loadEnv();

console.log("Running pipeline with MOCK adapters (no API calls)...\n");
console.log("⚠️  Using deterministic test data - no real API calls will be made\n");

// Get mock adapters
const mockAdapters = getMockAdapters();

// Run pipeline with mocks
runDailyPipeline(mockAdapters)
  .then((html) => {
    console.log(`\n✓ Pipeline completed successfully with mock adapters`);
    console.log(`  Newsletter HTML length: ${html.length} characters`);
    console.log(`  No API calls were made, no email was sent`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  });
