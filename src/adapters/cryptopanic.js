import axios from "axios";
import { getCached, setCached } from "../utils/cache.js";

const CRYPTOPANIC_BASE_URL = "https://cryptopanic.com/api/developer/v2";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Generates a cache key for the request
 */
function getCacheKey(coinSymbols, hoursBack) {
  const sortedCoins = [...coinSymbols].sort().join(",");
  return `cryptopanic-${sortedCoins}-${hoursBack}h`;
}

/**
 * Fetches cryptocurrency news from CryptoPanic API for the last N hours
 * @param {string[]} coinSymbols - Array of coin symbols (e.g., ['BTC', 'ETH'])
 * @param {number} hoursBack - How many hours back to fetch news (default: 48)
 * @returns {Promise<Array>} Array of news objects
 */
export default async function fetchNews(coinSymbols, hoursBack = 48) {
  if (!coinSymbols || !Array.isArray(coinSymbols) || coinSymbols.length === 0) {
    throw new Error("coinSymbols must be a non-empty array");
  }

  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  if (!apiKey) {
    throw new Error("CRYPTOPANIC_API_KEY environment variable is required");
  }

  // Check cache first
  const cacheKey = getCacheKey(coinSymbols, hoursBack);
  const cached = getCached(cacheKey);
  if (cached) {
    console.log("Returning cached news...");
    return cached;
  }

  const maxRetries = parseInt(process.env.MAX_RETRIES || DEFAULT_MAX_RETRIES, 10);
  const retryDelay = parseInt(process.env.RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS, 10);

  const result = await fetchWithRetry(coinSymbols, hoursBack, apiKey, maxRetries, retryDelay);

  // Store in cache
  setCached(cacheKey, result);

  return result;
}

/**
 * Fetches data with exponential backoff retry logic
 */
async function fetchWithRetry(coinSymbols, hoursBack, apiKey, maxRetries, baseDelay) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await performFetch(coinSymbols, hoursBack, apiKey);
    } catch (error) {
      lastError = error;

      // Don't retry on configuration or client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        console.error("CryptoPanic API client error (not retrying):", error.message);
        throw error;
      }

      // Retry on network errors or server errors (5xx)
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(
          `CryptoPanic API request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
          error.message
        );
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  console.error("CryptoPanic API request failed after all retries");
  throw lastError;
}

/**
 * Performs the actual HTTP request to CryptoPanic API
 */
async function performFetch(coinSymbols, hoursBack, apiKey) {
  const url = `${CRYPTOPANIC_BASE_URL}/posts/`;

  const params = {
    auth_token: apiKey,
    public: "true",
    kind: "news",
    currencies: coinSymbols.join(","),
  };

  const response = await axios.get(url, {
    params,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
    throw new Error("Invalid response format from CryptoPanic API");
  }

  // Calculate cutoff time for filtering
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Filter and transform news within the time window
  return response.data.results
    .map((item) => transformNewsItem(item, coinSymbols))
    .filter((item) => new Date(item.publishedAt) >= cutoffTime);
}

/**
 * Common cryptocurrency name to symbol mappings
 */
const COIN_NAME_MAP = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  cardano: "ADA",
  ripple: "XRP",
  dogecoin: "DOGE",
  polkadot: "DOT",
  polygon: "MATIC",
  avalanche: "AVAX",
  chainlink: "LINK",
};

/**
 * Extracts currency symbols from text by matching against known symbols and names
 */
function extractCurrenciesFromText(text, availableSymbols) {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const matches = new Set();

  // Check for symbol matches (e.g., "BTC", "ETH", "$ETH", "#BTC", "ETH:", etc.)
  // Pattern allows common prefixes ($, #) and various separators/suffixes
  availableSymbols.forEach((symbol) => {
    // Match symbol with optional prefix ($, #, etc.) and various contexts
    // This will match: $ETH, #BTC, ETH:, (ETH), ETH/USD, ETH-USDT, etc.
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?:^|[^a-z0-9])${escapedSymbol.toLowerCase()}(?:[^a-z]|$)`,
      "i"
    );
    if (pattern.test(lowerText)) {
      matches.add(symbol);
    }
  });

  // Check for coin name matches (e.g., "Bitcoin", "Ethereum")
  Object.entries(COIN_NAME_MAP).forEach(([name, symbol]) => {
    if (availableSymbols.includes(symbol)) {
      const pattern = new RegExp(`\\b${name}\\b`, "i");
      if (pattern.test(lowerText)) {
        matches.add(symbol);
      }
    }
  });

  return Array.from(matches);
}

/**
 * Transforms CryptoPanic API response to our internal data structure
 */
function transformNewsItem(item, availableSymbols) {
  // Get currencies from instruments field
  let currencies = item.instruments?.map((c) => c.code) || [];

  // If no currencies found in instruments, try to extract from title and metadata
  if (currencies.length === 0) {
    const textToSearch = [
      item.title || "",
      item.description || "",
    ].join(" ");

    currencies = extractCurrenciesFromText(textToSearch, availableSymbols);
  }

  return {
    id: item.id?.toString() || "unknown",
    title: item.title || "No title",
    description: item.description || "",
    publishedAt: item.created_at || item.published_at || new Date().toISOString(),
    source: item.source?.title || "Unknown",
    url: item.url || "",
    currencies,
    kind: item.kind || "news",
    domain: item.source?.domain || "",
    votes: {
      positive: item.votes?.positive || 0,
      negative: item.votes?.negative || 0,
      important: item.votes?.important || 0,
    },
  };
}

/**
 * Utility function to sleep for a specified duration
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
