/**
 * Application Entry Point
 *
 * Loads environment configuration and starts the daily newsletter scheduler.
 * Uses production adapters by default. To inject custom adapters:
 *
 * import createAdapters from "./adapters/factory.js";
 * const adapters = createAdapters({ ... });
 * scheduleDailyJob(adapters);
 */

import { scheduleDailyJob } from "./scheduler/cron.js";
import { loadEnv } from "./config/env.js";

loadEnv();
scheduleDailyJob(); // Uses default production adapters
