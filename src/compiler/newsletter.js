/**
 * Newsletter Compiler - Transforms data and renders email template
 *
 * Pure data transformation functions + template rendering
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mjml2html from "mjml";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, "../../templates/newsletter.mjml");

/**
 * Compiles newsletter from summaries and correlations
 * @param {Array} summaries - Array of summary objects from LLM
 * @param {Array} correlations - Array of correlation objects
 * @returns {string} Compiled HTML ready for email
 */
export default function compileNewsletter(summaries, correlations) {
  if (!Array.isArray(summaries) || !Array.isArray(correlations)) {
    throw new Error("summaries and correlations must be arrays");
  }

  console.log(`Compiling newsletter for ${summaries.length} coins...`);

  // Step 1: Prepare data for template
  const templateData = prepareTemplateData(summaries, correlations);

  // Step 2: Render template with data
  const html = renderTemplate(templateData);

  console.log("Newsletter compiled successfully");

  return html;
}

/**
 * Prepares data for the newsletter template
 */
function prepareTemplateData(summaries, correlations) {
  // Create a map for quick correlation lookup
  const correlationMap = new Map();
  correlations.forEach((c) => {
    correlationMap.set(c.symbol, c);
  });

  // Format coins data
  const coins = summaries.map((summary) => {
    const correlation = correlationMap.get(summary.symbol);
    if (!correlation) {
      console.warn(`No correlation data found for ${summary.symbol}`);
      return null;
    }
    return formatCoinData(summary, correlation);
  }).filter(Boolean); // Remove any null entries

  return {
    title: process.env.NEWSLETTER_TITLE || "Crypto Daily Newsletter",
    date: formatDate(new Date()),
    generatedAt: formatTimestamp(new Date()),
    coinCount: coins.length,
    coins,
  };
}

/**
 * Formats a single coin's data for the template
 */
function formatCoinData(summary, correlation) {
  const isUp = correlation.priceChangePercentage24h > 0;
  const color = getPriceColor(correlation.priceChangePercentage24h);

  // Get top news if available
  let topNews = null;
  if (correlation.relevantNews && correlation.relevantNews.length > 0) {
    const news = correlation.relevantNews[0];
    topNews = {
      title: news.title,
      source: news.source,
      url: news.url || "#", // Fallback if URL is missing
    };
  }

  return {
    name: correlation.name,
    symbol: correlation.symbol,
    currentPrice: formatPrice(correlation.currentPrice),
    priceChange: formatPercentage(correlation.priceChangePercentage24h),
    changeText: `${formatPercentage(correlation.priceChangePercentage24h)}`,
    color,
    summary: summary.summary,
    topNews,
  };
}

/**
 * Renders the MJML template with Handlebars and converts to HTML
 */
function renderTemplate(templateData) {
  // Load MJML template
  const mjmlTemplate = fs.readFileSync(TEMPLATE_PATH, "utf8");

  // Compile with Handlebars
  const template = Handlebars.compile(mjmlTemplate);
  const filledTemplate = template(templateData);

  // Convert MJML to HTML
  const { html, errors } = mjml2html(filledTemplate, {
    validationLevel: "soft", // Don't fail on minor issues
  });

  if (errors.length > 0) {
    console.warn("MJML conversion warnings:", errors);
  }

  return html;
}

/**
 * Formats price with commas and 2 decimal places
 */
function formatPrice(price) {
  if (price === null || price === undefined) return "0.00";
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats percentage with sign
 */
function formatPercentage(value) {
  if (value === null || value === undefined) return "0.00%";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Returns color based on price direction (optimized for dark theme)
 */
function getPriceColor(percentChange) {
  return percentChange > 0 ? "#22c55e" : "#ef4444"; // bright green : bright red
}

/**
 * Formats date as readable string
 */
function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats timestamp for footer
 */
function formatTimestamp(date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
