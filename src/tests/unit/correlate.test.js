/**
 * Unit Tests - Correlation Engine
 *
 * Tests the pure business logic that correlates market data with news
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import correlateData from "../../engine/correlate.js";

describe("Correlation Engine", () => {
  // Test fixtures
  const mockMarketData = [
    {
      id: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      currentPrice: 45000,
      priceChange24h: 2340,
      priceChangePercentage24h: 5.2,
      volume24h: 28000000000,
      marketCap: 850000000000,
    },
    {
      id: "ethereum",
      symbol: "ETH",
      name: "Ethereum",
      currentPrice: 3200,
      priceChange24h: -92,
      priceChangePercentage24h: -2.8,
      volume24h: 15000000000,
      marketCap: 380000000000,
    },
  ];

  const mockNewsData = [
    {
      id: "1",
      title: "Bitcoin ETF sees record inflows",
      description: "Major institutional investment",
      source: "CoinDesk",
      url: "https://example.com/1",
      currencies: ["BTC"],
      publishedAt: new Date().toISOString(),
      votes: { positive: 120, negative: 5, important: 45 },
    },
    {
      id: "2",
      title: "Ethereum upgrade completes",
      description: "Network improvements deployed",
      source: "The Block",
      url: "https://example.com/2",
      currencies: ["ETH"],
      publishedAt: new Date().toISOString(),
      votes: { positive: 98, negative: 3, important: 67 },
    },
    {
      id: "3",
      title: "Crypto market rallies",
      description: "Broad market gains",
      source: "Bloomberg",
      url: "https://example.com/3",
      currencies: ["BTC", "ETH"],
      publishedAt: new Date().toISOString(),
      votes: { positive: 200, negative: 12, important: 89 },
    },
  ];

  describe("correlateData()", () => {
    it("should correlate market data with news for all coins", () => {
      const result = correlateData(mockMarketData, mockNewsData);

      assert.strictEqual(result.length, 2, "Should return correlation for each coin");
      assert.strictEqual(result[0].symbol, "BTC");
      assert.strictEqual(result[1].symbol, "ETH");
    });

    it("should include all required correlation fields", () => {
      const result = correlateData(mockMarketData, mockNewsData);
      const btcCorrelation = result[0];

      assert.ok(btcCorrelation.coin);
      assert.ok(btcCorrelation.symbol);
      assert.ok(btcCorrelation.name);
      assert.ok(typeof btcCorrelation.currentPrice === "number");
      assert.ok(typeof btcCorrelation.priceChangePercentage24h === "number");
      assert.ok(btcCorrelation.direction);
      assert.ok(Array.isArray(btcCorrelation.relevantNews));
      assert.ok(Array.isArray(btcCorrelation.fallbackSignals));
      assert.ok(btcCorrelation.explanationBasis);
    });

    it("should filter news by coin symbol", () => {
      const result = correlateData(mockMarketData, mockNewsData);
      const btcCorrelation = result[0];

      // BTC should have 2 news articles (one specific, one multi-currency)
      assert.strictEqual(btcCorrelation.relevantNews.length, 2);
      assert.ok(btcCorrelation.relevantNews[0].title.includes("Bitcoin") ||
                btcCorrelation.relevantNews[0].title.includes("Crypto market"));
    });

    it("should sort news by most recent first", () => {
      const oldNews = {
        ...mockNewsData[0],
        id: "old",
        publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };
      const recentNews = {
        ...mockNewsData[1],
        id: "recent",
        publishedAt: new Date().toISOString(),
        currencies: ["BTC"],
      };

      const newsWithDates = [oldNews, recentNews];
      const result = correlateData([mockMarketData[0]], newsWithDates);

      assert.strictEqual(result[0].relevantNews[0].title, recentNews.title,
        "Should sort most recent news first");
    });

    it("should limit to 5 most recent news articles", () => {
      const manyNews = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        title: `News ${i}`,
        source: "Test",
        url: "https://test.com",
        currencies: ["BTC"],
        publishedAt: new Date(Date.now() - i * 3600000).toISOString(), // Staggered times
        votes: { positive: 10, negative: 0, important: 5 },
      }));

      const result = correlateData([mockMarketData[0]], manyNews);

      assert.strictEqual(result[0].relevantNews.length, 5,
        "Should limit to 5 news articles");
    });

    it("should determine direction correctly", () => {
      const result = correlateData(mockMarketData, mockNewsData);

      assert.strictEqual(result[0].direction, "up", "BTC with +5.2% should be up");
      assert.strictEqual(result[1].direction, "down", "ETH with -2.8% should be down");
    });

    it("should determine explanation basis based on news count", () => {
      // 2+ news articles = "news"
      const twoNewsCoins = correlateData([mockMarketData[0]], mockNewsData);
      assert.strictEqual(twoNewsCoins[0].explanationBasis, "news");

      // 1 news article = "both"
      const oneNewsCoins = correlateData([mockMarketData[0]], [mockNewsData[0]]);
      assert.strictEqual(oneNewsCoins[0].explanationBasis, "both");

      // 0 news articles = "signals"
      const noNewsCoins = correlateData([mockMarketData[0]], []);
      assert.strictEqual(noNewsCoins[0].explanationBasis, "signals");
    });

    it("should generate fallback signals for all coins", () => {
      const result = correlateData(mockMarketData, []);
      const signals = result[0].fallbackSignals;

      assert.ok(signals.length >= 3, "Should have at least 3 fallback signals");
      assert.ok(signals.some(s => s.includes("Price")), "Should include price signal");
      assert.ok(signals.some(s => s.includes("volume")), "Should include volume signal");
      assert.ok(signals.some(s => s.includes("Market cap")), "Should include market cap signal");
    });

    it("should format fallback signals with proper units", () => {
      const result = correlateData([mockMarketData[0]], []);
      const signals = result[0].fallbackSignals;

      // Check for currency formatting (billions)
      const volumeSignal = signals.find(s => s.includes("volume"));
      assert.ok(volumeSignal.includes("$28.0B"), "Should format volume in billions");

      const marketCapSignal = signals.find(s => s.includes("Market cap"));
      assert.ok(marketCapSignal.includes("$850.0B"), "Should format market cap in billions");
    });

    it("should throw error for invalid input types", () => {
      assert.throws(() => correlateData(null, mockNewsData),
        /arrays/,
        "Should throw for null marketData");

      assert.throws(() => correlateData(mockMarketData, "not-array"),
        /arrays/,
        "Should throw for invalid newsData");
    });

    it("should handle empty news array gracefully", () => {
      const result = correlateData(mockMarketData, []);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].relevantNews.length, 0);
      assert.strictEqual(result[0].explanationBasis, "signals");
    });

    it("should preserve all market data fields in correlation", () => {
      const result = correlateData([mockMarketData[0]], []);
      const correlation = result[0];

      assert.strictEqual(correlation.coin, "bitcoin");
      assert.strictEqual(correlation.symbol, "BTC");
      assert.strictEqual(correlation.name, "Bitcoin");
      assert.strictEqual(correlation.currentPrice, 45000);
      assert.strictEqual(correlation.priceChange24h, 2340);
      assert.strictEqual(correlation.priceChangePercentage24h, 5.2);
      assert.strictEqual(correlation.volume24h, 28000000000);
      assert.strictEqual(correlation.marketCap, 850000000000);
    });

    it("should format news items with required fields", () => {
      const result = correlateData([mockMarketData[0]], mockNewsData);
      const newsItem = result[0].relevantNews[0];

      assert.ok(newsItem.title);
      assert.ok(typeof newsItem.description === "string");
      assert.ok(newsItem.source);
      assert.ok(typeof newsItem.url === "string");
      assert.ok(newsItem.publishedAt);
      assert.ok(newsItem.votes);
      assert.ok(typeof newsItem.votes.positive === "number");
    });
  });

  describe("Edge Cases", () => {
    it("should handle coins with zero price change", () => {
      const zeroCoin = {
        ...mockMarketData[0],
        priceChangePercentage24h: 0,
      };

      const result = correlateData([zeroCoin], []);

      assert.strictEqual(result[0].direction, "down", "Zero change should be down");
      assert.ok(result[0].fallbackSignals[0].includes("+0.00%"));
    });

    it("should handle coins with very small price changes", () => {
      const smallChangeCoin = {
        ...mockMarketData[0],
        priceChangePercentage24h: 0.01,
      };

      const result = correlateData([smallChangeCoin], []);

      assert.strictEqual(result[0].direction, "up");
      assert.ok(result[0].fallbackSignals[0].includes("+0.01%"));
    });

    it("should handle news with missing optional fields", () => {
      const minimalNews = {
        id: "1",
        title: "Test news",
        source: "Test",
        currencies: ["BTC"],
        publishedAt: new Date().toISOString(),
        votes: { positive: 0, negative: 0, important: 0 },
      };

      const result = correlateData([mockMarketData[0]], [minimalNews]);

      assert.strictEqual(result[0].relevantNews.length, 1);
      assert.strictEqual(result[0].relevantNews[0].description, "");
      assert.strictEqual(result[0].relevantNews[0].url, "");
    });

    it("should handle very large market cap values", () => {
      const largeCoin = {
        ...mockMarketData[0],
        marketCap: 1500000000000, // 1.5 trillion
      };

      const result = correlateData([largeCoin], []);
      const marketCapSignal = result[0].fallbackSignals.find(s => s.includes("Market cap"));

      assert.ok(marketCapSignal.includes("$1500.0B"), "Should format large values correctly");
    });
  });
});
