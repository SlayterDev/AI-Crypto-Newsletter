/**
 * Correlation Engine - Maps price movements to news and generates structured data for LLM
 *
 * This is a pure function module with no side effects.
 * All functions are deterministic and unit-testable.
 */

/**
 * Main correlation function - correlates market data with news data
 * @param {Array} marketData - Array of market data objects from CoinGecko
 * @param {Array} newsData - Array of news objects from CryptoPanic
 * @returns {Array} Array of correlation results, one per coin
 */
export default function correlateData(marketData, newsData) {
  if (!Array.isArray(marketData) || !Array.isArray(newsData)) {
    throw new Error("marketData and newsData must be arrays");
  }

  return marketData.map((coin) => correlateCoin(coin, newsData));
}

/**
 * Correlates a single coin with relevant news
 */
function correlateCoin(coin, allNews) {
  const symbol = coin.symbol;

  // Find news articles that mention this coin
  const relevantNews = allNews
    .filter((news) => news.currencies.includes(symbol))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)) // Most recent first
    .slice(0, 5) // Top 5 most recent
    .map(formatNewsItem);

  // Generate fallback signals
  const fallbackSignals = generateFallbackSignals(coin);

  // Determine explanation basis
  const explanationBasis = determineExplanationBasis(relevantNews.length);

  return {
    coin: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    currentPrice: coin.currentPrice,
    priceChange24h: coin.priceChange24h,
    priceChangePercentage24h: coin.priceChangePercentage24h,
    direction: determineDirection(coin.priceChangePercentage24h),
    volume24h: coin.volume24h,
    marketCap: coin.marketCap,
    relevantNews,
    fallbackSignals,
    explanationBasis,
  };
}

/**
 * Formats a news item for correlation output
 */
function formatNewsItem(news) {
  return {
    title: news.title,
    description: news.description || "",
    source: news.source,
    url: news.url || "",
    publishedAt: news.publishedAt,
    votes: news.votes,
  };
}

/**
 * Generates fallback signals when news is sparse
 */
function generateFallbackSignals(coin) {
  const signals = [];

  // Price change signal
  const priceChangeFormatted = formatPercentage(coin.priceChangePercentage24h);
  const direction = coin.priceChangePercentage24h >= 0 ? "increased" : "decreased";
  signals.push(`Price ${direction} by ${priceChangeFormatted} in 24h`);

  // Volume signal
  signals.push(`24h trading volume: ${formatCurrency(coin.volume24h)}`);

  // Market cap signal
  signals.push(`Market cap: ${formatCurrency(coin.marketCap)}`);

  return signals;
}

/**
 * Determines explanation basis based on available news
 */
function determineExplanationBasis(newsCount) {
  if (newsCount >= 2) return "news";
  if (newsCount === 1) return "both";
  return "signals";
}

/**
 * Determines price direction from percentage change
 */
function determineDirection(percentChange) {
  return percentChange > 0 ? "up" : "down";
}

/**
 * Formats large numbers as currency (e.g., "$28.5B", "$1.2M")
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "$0";

  const absAmount = Math.abs(amount);

  if (absAmount >= 1e9) {
    return `$${(amount / 1e9).toFixed(1)}B`;
  } else if (absAmount >= 1e6) {
    return `$${(amount / 1e6).toFixed(1)}M`;
  } else if (absAmount >= 1e3) {
    return `$${(amount / 1e3).toFixed(1)}K`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Formats percentage with sign (e.g., "+2.98%", "-1.45%")
 */
function formatPercentage(value) {
  if (value === null || value === undefined) return "0.00%";

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
