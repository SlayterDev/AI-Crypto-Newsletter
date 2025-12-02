/**
 * Adapter Factory - Creates adapter instances with dependency injection support
 *
 * Allows swapping production adapters with mocks for testing or alternative implementations
 */

import fetchMarketData from "./coingecko.js";
import fetchNews from "./cryptopanic.js";
import generateSummaries from "./openai.js";
import sendNewsletter from "./smtp.js";

/**
 * Creates an adapter set with optional overrides
 * @param {Object} config - Optional adapter overrides
 * @param {Function} config.marketData - Market data fetcher (default: CoinGecko)
 * @param {Function} config.news - News fetcher (default: CryptoPanic)
 * @param {Function} config.llm - LLM summary generator (default: OpenAI)
 * @param {Function} config.mailer - Email sender (default: SMTP/nodemailer)
 * @returns {Object} Adapter set ready for injection
 */
export function createAdapters(config = {}) {
  return {
    marketData: config.marketData || fetchMarketData,
    news: config.news || fetchNews,
    llm: config.llm || generateSummaries,
    mailer: config.mailer || sendNewsletter,
  };
}

export default createAdapters;
