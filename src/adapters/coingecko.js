import axios from "axios";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Fetches 24-hour market data for specified cryptocurrencies from CoinGecko API
 * @param {string[]} coinIds - Array of CoinGecko coin IDs (e.g., ['bitcoin', 'ethereum'])
 * @returns {Promise<Array>} Array of market data objects
 */
export default async function fetchMarketData(coinIds) {
  if (!coinIds || !Array.isArray(coinIds) || coinIds.length === 0) {
    throw new Error("coinIds must be a non-empty array");
  }

  const apiKey = process.env.COINGECKO_API_KEY;
  if (!apiKey) {
    throw new Error("COINGECKO_API_KEY environment variable is required");
  }

  const maxRetries = parseInt(process.env.MAX_RETRIES || DEFAULT_MAX_RETRIES, 10);
  const retryDelay = parseInt(process.env.RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS, 10);

  return await fetchWithRetry(coinIds, apiKey, maxRetries, retryDelay);
}

/**
 * Fetches data with exponential backoff retry logic
 */
async function fetchWithRetry(coinIds, apiKey, maxRetries, baseDelay) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await performFetch(coinIds, apiKey);
    } catch (error) {
      lastError = error;

      // Don't retry on configuration or client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        console.error("CoinGecko API client error (not retrying):", error.message);
        throw error;
      }

      // Retry on network errors or server errors (5xx)
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(
          `CoinGecko API request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
          error.message
        );
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  console.error("CoinGecko API request failed after all retries");
  throw lastError;
}

/**
 * Performs the actual HTTP request to CoinGecko API
 */
async function performFetch(coinIds, apiKey) {
  const url = `${COINGECKO_BASE_URL}/coins/markets`;

  const params = {
    vs_currency: "usd",
    ids: coinIds.join(","),
    order: "market_cap_desc",
    per_page: coinIds.length,
    page: 1,
    sparkline: false,
    price_change_percentage: "24h",
    x_cg_demo_api_key: apiKey,
  };

  const response = await axios.get(url, {
    params,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.data || !Array.isArray(response.data)) {
    throw new Error("Invalid response format from CoinGecko API");
  }

  // Transform API response to our data structure
  return response.data.map(transformCoinData);
}

/**
 * Transforms CoinGecko API response to our internal data structure
 */
function transformCoinData(coin) {
  return {
    id: coin.id,
    symbol: coin.symbol?.toUpperCase() || "UNKNOWN",
    name: coin.name,
    currentPrice: coin.current_price,
    priceChange24h: coin.price_change_24h,
    priceChangePercentage24h: coin.price_change_percentage_24h,
    volume24h: coin.total_volume,
    marketCap: coin.market_cap,
    lastUpdated: coin.last_updated,
  };
}

/**
 * Utility function to sleep for a specified duration
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
