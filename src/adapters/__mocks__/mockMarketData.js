/**
 * Mock Market Data Adapter - Returns deterministic test data without API calls
 * Use for testing correlation and pipeline logic
 */

/**
 * Mock implementation of fetchMarketData
 * @param {string[]} coinIds - Array of CoinGecko coin IDs
 * @returns {Promise<Array>} Mock market data
 */
export default async function mockFetchMarketData(coinIds) {
  if (!coinIds || !Array.isArray(coinIds) || coinIds.length === 0) {
    throw new Error("coinIds must be a non-empty array");
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Return deterministic mock data (camelCase to match real adapter)
  const mockData = {
    bitcoin: {
      id: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      currentPrice: 45000,
      priceChange24h: 2340,
      priceChangePercentage24h: 5.2,
      volume24h: 28000000000,
      marketCap: 850000000000,
      lastUpdated: new Date().toISOString(),
    },
    ethereum: {
      id: "ethereum",
      symbol: "ETH",
      name: "Ethereum",
      currentPrice: 3200,
      priceChange24h: -92,
      priceChangePercentage24h: -2.8,
      volume24h: 15000000000,
      marketCap: 380000000000,
      lastUpdated: new Date().toISOString(),
    },
    solana: {
      id: "solana",
      symbol: "SOL",
      name: "Solana",
      currentPrice: 110,
      priceChange24h: 8.6,
      priceChangePercentage24h: 8.5,
      volume24h: 3500000000,
      marketCap: 48000000000,
      lastUpdated: new Date().toISOString(),
    },
    cardano: {
      id: "cardano",
      symbol: "ADA",
      name: "Cardano",
      currentPrice: 0.85,
      priceChange24h: 0.03,
      priceChangePercentage24h: 3.6,
      volume24h: 890000000,
      marketCap: 30000000000,
      lastUpdated: new Date().toISOString(),
    },
  };

  return coinIds.map((id) => mockData[id] || {
    id,
    symbol: id.toUpperCase().slice(0, 3),
    name: id.charAt(0).toUpperCase() + id.slice(1),
    currentPrice: 100,
    priceChange24h: 0,
    priceChangePercentage24h: 0,
    volume24h: 100000000,
    marketCap: 1000000000,
    lastUpdated: new Date().toISOString(),
  });
}
