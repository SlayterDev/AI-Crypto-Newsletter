import cron from "node-cron";
import { runDailyPipeline } from "../pipeline.js";

const DEFAULT_SCHEDULE = "0 0 * * *"; // midnight in local timezone

/**
 * Schedules the daily newsletter job
 * @param {Object} adapters - Optional adapter set to inject into pipeline
 */
export function scheduleDailyJob(adapters) {
  const schedule = process.env.CRON_SCHEDULE || DEFAULT_SCHEDULE;

  // Validate cron expression
  if (!cron.validate(schedule)) {
    throw new Error(`Invalid CRON_SCHEDULE: "${schedule}". Must be a valid cron expression.`);
  }

  // Get timezone info
  const timezone = getTimezoneInfo();

  console.log(`Scheduling daily newsletter with cron: ${schedule}`);
  console.log(`Timezone: ${timezone}`);
  console.log(`Next run: ${getNextRunTime(schedule)}`);

  cron.schedule(schedule, () => runDailyPipeline(adapters), {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}

/**
 * Gets timezone information for logging
 */
function getTimezoneInfo() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Date().getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetSign = offset <= 0 ? '+' : '-';

  return `${tz} (UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')})`;
}

/**
 * Helper to display next run time (for logging)
 */
function getNextRunTime(schedule) {
  // Parse cron to show human-readable next run
  // This is approximate, for display purposes
  const now = new Date();
  const [minute, hour, dayOfMonth, month, dayOfWeek] = schedule.split(" ");

  if (hour === "*" && minute === "*") {
    return "every minute";
  }

  if (hour === "*") {
    return `every hour at minute ${minute}`;
  }

  if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `daily at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")} local time`;
  }

  return "per configured schedule";
}
