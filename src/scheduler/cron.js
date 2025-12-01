import cron from "node-cron";
import { runDailyPipeline } from "../pipeline.js";

export function scheduleDailyJob() {
  cron.schedule("0 0 * * *", runDailyPipeline); // midnight UTC
}
