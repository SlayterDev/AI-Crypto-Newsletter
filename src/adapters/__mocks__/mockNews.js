/**
 * Mock News Adapter - Returns deterministic test news without API calls
 * Use for testing correlation and pipeline logic
 */

/**
 * Mock implementation of fetchNews
 * @param {string[]} coinSymbols - Array of coin symbols (e.g., ['BTC', 'ETH'])
 * @param {number} hoursBack - Hours to look back (default: 48)
 * @returns {Promise<Array>} Mock news articles
 */
export default async function mockFetchNews(coinSymbols, hoursBack = 48) {
  if (!coinSymbols || !Array.isArray(coinSymbols) || coinSymbols.length === 0) {
    throw new Error("coinSymbols must be a non-empty array");
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 10));

  const now = new Date();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);

  // Return deterministic mock news data (camelCase to match real adapter)
  const mockNews = [
    {
      id: "1",
      title: "Bitcoin ETF sees record inflows as institutional demand surges",
      description: "Major Bitcoin ETF products saw significant institutional investment this week",
      publishedAt: yesterday.toISOString(),
      source: "CoinDesk",
      url: "https://example.com/btc-etf-inflows",
      currencies: ["BTC"],
      kind: "news",
      domain: "coindesk.com",
      votes: { positive: 120, negative: 5, important: 45 },
    },
    {
      id: "2",
      title: "Ethereum network upgrade completes successfully, gas fees drop",
      description: "Latest Ethereum upgrade brings significant improvements to network efficiency",
      publishedAt: yesterday.toISOString(),
      source: "The Block",
      url: "https://example.com/eth-upgrade",
      currencies: ["ETH"],
      kind: "news",
      domain: "theblock.co",
      votes: { positive: 98, negative: 3, important: 67 },
    },
    {
      id: "3",
      title: "Solana announces partnership with major payment processor",
      description: "Strategic partnership aims to bring crypto payments to mainstream retail",
      publishedAt: yesterday.toISOString(),
      source: "Decrypt",
      url: "https://example.com/sol-partnership",
      currencies: ["SOL"],
      kind: "news",
      domain: "decrypt.co",
      votes: { positive: 145, negative: 8, important: 52 },
    },
    {
      id: "4",
      title: "Crypto market rallies on positive regulatory developments",
      description: "New regulatory framework provides clarity for digital asset markets",
      publishedAt: yesterday.toISOString(),
      source: "Bloomberg Crypto",
      url: "https://example.com/market-rally",
      currencies: ["BTC", "ETH", "SOL"],
      kind: "news",
      domain: "bloomberg.com",
      votes: { positive: 200, negative: 12, important: 89 },
    },
    {
      id: "5",
      title: "Cardano smart contract activity reaches new all-time high",
      description: "Developer activity and on-chain transactions surge on Cardano network",
      publishedAt: yesterday.toISOString(),
      source: "CoinTelegraph",
      url: "https://example.com/ada-smart-contracts",
      currencies: ["ADA"],
      kind: "news",
      domain: "cointelegraph.com",
      votes: { positive: 78, negative: 4, important: 34 },
    },
  ];

  // Filter news by requested coin symbols
  return mockNews.filter((article) =>
    article.currencies.some((currency) => coinSymbols.includes(currency))
  );
}
