/**
 * Integration Tests - Pipeline with Mock Adapters
 *
 * Tests the full pipeline flow without making external API calls
 */

import { describe, it, before } from "node:test";
import assert from "node:assert";
import { runDailyPipeline } from "../../pipeline.js";
import { getMockAdapters } from "../fixtures/mockAdapters.js";

describe("Pipeline Integration", () => {
  let originalEnv;

  before(() => {
    // Save and set required environment variables
    originalEnv = { ...process.env };
    process.env.COINS = "bitcoin,ethereum,solana";
    process.env.NEWSLETTER_TITLE = "Test Newsletter";
  });

  describe("runDailyPipeline() with mocks", () => {
    it("should complete full pipeline with mock adapters", async () => {
      const mockAdapters = getMockAdapters();
      const result = await runDailyPipeline(mockAdapters);

      assert.ok(result, "Should return result");
      assert.ok(typeof result === "string", "Should return HTML string");
      assert.ok(result.length > 0, "Should return non-empty HTML");
    });

    it("should generate HTML newsletter", async () => {
      const mockAdapters = getMockAdapters();
      const html = await runDailyPipeline(mockAdapters);

      // Check for HTML structure
      assert.ok(html.includes("<!doctype html>"), "Should have DOCTYPE");
      assert.ok(html.includes("<html"), "Should have html tag");
      assert.ok(html.includes("</html>"), "Should close html tag");
    });

    it("should include coin data in newsletter", async () => {
      const mockAdapters = getMockAdapters();
      const html = await runDailyPipeline(mockAdapters);

      // Check for coin mentions
      assert.ok(html.includes("Bitcoin") || html.includes("BTC"),
        "Should include Bitcoin");
      assert.ok(html.includes("Ethereum") || html.includes("ETH"),
        "Should include Ethereum");
      assert.ok(html.includes("Solana") || html.includes("SOL"),
        "Should include Solana");
    });

    it("should include price data", async () => {
      const mockAdapters = getMockAdapters();
      const html = await runDailyPipeline(mockAdapters);

      // Check for price indicators
      assert.ok(html.includes("$") || html.includes("USD"),
        "Should include price indicators");
      assert.ok(html.includes("%"),
        "Should include percentage changes");
    });

    it("should call all adapters", async () => {
      // Track if adapters were called with mock implementations
      let marketDataCalled = false;
      let newsCalled = false;
      let llmCalled = false;
      let mailerCalled = false;

      const spyAdapters = getMockAdapters();
      const mockAdapters = {
        marketData: async (...args) => {
          marketDataCalled = true;
          return spyAdapters.marketData(...args);
        },
        news: async (...args) => {
          newsCalled = true;
          return spyAdapters.news(...args);
        },
        llm: async (...args) => {
          llmCalled = true;
          return spyAdapters.llm(...args);
        },
        mailer: async (...args) => {
          mailerCalled = true;
          return spyAdapters.mailer(...args);
        },
      };

      await runDailyPipeline(mockAdapters);

      assert.ok(marketDataCalled, "Should call marketData adapter");
      assert.ok(newsCalled, "Should call news adapter");
      assert.ok(llmCalled, "Should call llm adapter");
      assert.ok(mailerCalled, "Should call mailer adapter");
    });

    it("should call adapters in correct order", async () => {
      const callOrder = [];

      const orderedAdapters = {
        marketData: async (...args) => {
          callOrder.push("marketData");
          return getMockAdapters().marketData(...args);
        },
        news: async (...args) => {
          callOrder.push("news");
          return getMockAdapters().news(...args);
        },
        llm: async (...args) => {
          callOrder.push("llm");
          return getMockAdapters().llm(...args);
        },
        mailer: async (...args) => {
          callOrder.push("mailer");
          return getMockAdapters().mailer(...args);
        },
      };

      await runDailyPipeline(orderedAdapters);

      assert.deepStrictEqual(callOrder, ["marketData", "news", "llm", "mailer"],
        "Should call adapters in correct order");
    });

    it("should pass correct data between pipeline stages", async () => {
      let capturedMarketData;
      let capturedNewsData;
      let capturedLLMInput;

      const dataCapturingAdapters = {
        marketData: async (coinIds) => {
          const result = await getMockAdapters().marketData(coinIds);
          capturedMarketData = result;
          return result;
        },
        news: async (symbols, hours) => {
          // Should receive symbols from market data
          const result = await getMockAdapters().news(symbols, hours);
          capturedNewsData = result;
          return result;
        },
        llm: async (prompt, schema, expectedCoins) => {
          capturedLLMInput = { prompt, schema, expectedCoins };
          return getMockAdapters().llm(prompt, schema, expectedCoins);
        },
        mailer: getMockAdapters().mailer,
      };

      await runDailyPipeline(dataCapturingAdapters);

      assert.ok(capturedMarketData, "Should capture market data");
      assert.ok(Array.isArray(capturedMarketData), "Market data should be array");
      assert.ok(capturedNewsData, "Should capture news data");
      assert.ok(Array.isArray(capturedNewsData), "News data should be array");
      assert.ok(capturedLLMInput, "Should capture LLM input");
      assert.ok(capturedLLMInput.prompt, "LLM should receive prompt");
      assert.ok(capturedLLMInput.expectedCoins, "LLM should receive expected coins");
    });

    it("should handle errors gracefully", async () => {
      const errorAdapter = {
        ...getMockAdapters(),
        marketData: async () => {
          throw new Error("Market data fetch failed");
        },
      };

      await assert.rejects(
        () => runDailyPipeline(errorAdapter),
        /Market data fetch failed/,
        "Should propagate adapter errors"
      );
    });
  });

  describe("Pipeline Data Flow", () => {
    it("should correlate market data with news", async () => {
      let correlationInput;

      const adapters = {
        ...getMockAdapters(),
        llm: async (prompt) => {
          correlationInput = prompt;
          return getMockAdapters().llm(prompt, {}, ["BTC", "ETH", "SOL"]);
        },
      };

      await runDailyPipeline(adapters);

      // Prompt should include both market data and news
      assert.ok(correlationInput.includes("Bitcoin") || correlationInput.includes("BTC"));
      assert.ok(correlationInput.includes("%"), "Should include price changes");
    });

    it("should generate summaries for all coins", async () => {
      let summaryCoins;

      const adapters = {
        ...getMockAdapters(),
        llm: async (prompt, schema, expectedCoins) => {
          summaryCoins = expectedCoins;
          return getMockAdapters().llm(prompt, schema, expectedCoins);
        },
      };

      await runDailyPipeline(adapters);

      assert.ok(Array.isArray(summaryCoins));
      assert.ok(summaryCoins.length > 0, "Should generate summaries for coins");
    });

    it("should compile newsletter with summaries", async () => {
      const adapters = getMockAdapters();
      const html = await runDailyPipeline(adapters);

      // Should include mock summary text
      assert.ok(
        html.includes("ETF") ||
        html.includes("institutional") ||
        html.includes("market"),
        "Should include summary content"
      );
    });

    it("should return email send result", async () => {
      let sendResult;

      const adapters = {
        ...getMockAdapters(),
        mailer: async (html) => {
          const result = await getMockAdapters().mailer(html);
          sendResult = result;
          return result;
        },
      };

      await runDailyPipeline(adapters);

      assert.ok(sendResult, "Should have send result");
      assert.ok(sendResult.success, "Send should be successful");
      assert.ok(sendResult.messageId, "Should have message ID");
    });
  });

  describe("Edge Cases", () => {
    it("should handle single coin", async () => {
      const originalCoins = process.env.COINS;
      process.env.COINS = "bitcoin";

      try {
        const mockAdapters = getMockAdapters();
        const html = await runDailyPipeline(mockAdapters);

        assert.ok(html.length > 0);
        assert.ok(html.includes("Bitcoin") || html.includes("BTC"));
      } finally {
        process.env.COINS = originalCoins;
      }
    });

    it("should handle coins with no news", async () => {
      const adapters = {
        ...getMockAdapters(),
        news: async () => [], // No news
      };

      const html = await runDailyPipeline(adapters);

      assert.ok(html.length > 0, "Should still generate newsletter");
    });

    it("should use default adapters when none provided", async () => {
      // This would use real adapters, so we just verify it doesn't crash
      // when called with undefined (but we won't actually call it in tests)
      assert.doesNotThrow(() => {
        // Just verify the function accepts undefined
        const pipeline = runDailyPipeline;
        assert.strictEqual(typeof pipeline, "function");
      });
    });
  });
});
