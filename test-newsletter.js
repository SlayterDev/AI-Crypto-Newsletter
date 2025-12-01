import fs from "fs";
import { loadEnv } from "./src/config/env.js";
import { runDailyPipeline } from "./src/pipeline.js";

// Load environment and run pipeline
loadEnv();

console.log("Running pipeline and saving newsletter...\n");

runDailyPipeline()
  .then((html) => {
    // Save HTML to file
    const filename = `newsletter-${new Date().toISOString().split("T")[0]}.html`;
    fs.writeFileSync(filename, html, "utf8");

    console.log(`\n✓ Newsletter saved to: ${filename}`);
    console.log("  Open this file in a browser to preview the newsletter");

    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  });
