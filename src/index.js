import { scheduleDailyJob } from "./scheduler/cron.js";
import { loadEnv } from "./config/env.js";

loadEnv();
scheduleDailyJob();
