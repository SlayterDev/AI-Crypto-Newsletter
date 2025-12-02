/**
 * Unit Tests - Adapter Factory
 *
 * Tests dependency injection factory pattern
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import createAdapters from "../../adapters/factory.js";

describe("Adapter Factory", () => {
  describe("createAdapters()", () => {
    it("should create default adapter set when called with no arguments", () => {
      const adapters = createAdapters();

      assert.ok(adapters.marketData, "Should have marketData adapter");
      assert.ok(adapters.news, "Should have news adapter");
      assert.ok(adapters.llm, "Should have llm adapter");
      assert.ok(adapters.mailer, "Should have mailer adapter");
    });

    it("should return functions for all adapters", () => {
      const adapters = createAdapters();

      assert.strictEqual(typeof adapters.marketData, "function");
      assert.strictEqual(typeof adapters.news, "function");
      assert.strictEqual(typeof adapters.llm, "function");
      assert.strictEqual(typeof adapters.mailer, "function");
    });

    it("should allow overriding specific adapters", () => {
      const mockMarketData = async () => [{ mock: true }];
      const adapters = createAdapters({ marketData: mockMarketData });

      assert.strictEqual(adapters.marketData, mockMarketData,
        "Should use provided marketData adapter");
      assert.ok(adapters.news !== mockMarketData,
        "Should use default news adapter");
    });

    it("should allow overriding all adapters", () => {
      const mockAdapters = {
        marketData: async () => [],
        news: async () => [],
        llm: async () => [],
        mailer: async () => ({}),
      };

      const adapters = createAdapters(mockAdapters);

      assert.strictEqual(adapters.marketData, mockAdapters.marketData);
      assert.strictEqual(adapters.news, mockAdapters.news);
      assert.strictEqual(adapters.llm, mockAdapters.llm);
      assert.strictEqual(adapters.mailer, mockAdapters.mailer);
    });

    it("should allow partial overrides with defaults", () => {
      const mockLLM = async () => [];
      const mockMailer = async () => ({ success: true });

      const adapters = createAdapters({
        llm: mockLLM,
        mailer: mockMailer,
      });

      assert.strictEqual(adapters.llm, mockLLM);
      assert.strictEqual(adapters.mailer, mockMailer);
      assert.ok(typeof adapters.marketData === "function",
        "Should have default marketData");
      assert.ok(typeof adapters.news === "function",
        "Should have default news");
    });

    it("should handle empty config object", () => {
      const adapters = createAdapters({});

      assert.ok(adapters.marketData);
      assert.ok(adapters.news);
      assert.ok(adapters.llm);
      assert.ok(adapters.mailer);
    });

    it("should ignore extra config properties", () => {
      const adapters = createAdapters({
        marketData: async () => [],
        extraProperty: "should be ignored",
      });

      assert.ok(adapters.marketData);
      assert.ok(!adapters.extraProperty,
        "Should not include extra properties");
    });

    it("should maintain adapter function identity", () => {
      const mockAdapter = async () => [];
      const adapters1 = createAdapters({ marketData: mockAdapter });
      const adapters2 = createAdapters({ marketData: mockAdapter });

      assert.strictEqual(adapters1.marketData, adapters2.marketData,
        "Same adapter function should maintain identity");
    });
  });

  describe("Adapter Interface", () => {
    it("should create adapters that can be called", async () => {
      const mockMarketData = async (coinIds) => {
        return coinIds.map(id => ({ id, price: 100 }));
      };

      const adapters = createAdapters({ marketData: mockMarketData });
      const result = await adapters.marketData(["bitcoin"]);

      assert.ok(Array.isArray(result));
      assert.strictEqual(result[0].id, "bitcoin");
    });

    it("should preserve adapter parameters", async () => {
      let capturedArgs;
      const mockNews = async (...args) => {
        capturedArgs = args;
        return [];
      };

      const adapters = createAdapters({ news: mockNews });
      await adapters.news(["BTC", "ETH"], 48);

      assert.deepStrictEqual(capturedArgs, [["BTC", "ETH"], 48]);
    });

    it("should preserve adapter return values", async () => {
      const expectedResult = { success: true, messageId: "123" };
      const mockMailer = async () => expectedResult;

      const adapters = createAdapters({ mailer: mockMailer });
      const result = await adapters.mailer("<html></html>");

      assert.deepStrictEqual(result, expectedResult);
    });

    it("should propagate adapter errors", async () => {
      const mockAdapter = async () => {
        throw new Error("Test error");
      };

      const adapters = createAdapters({ marketData: mockAdapter });

      await assert.rejects(
        () => adapters.marketData(["bitcoin"]),
        /Test error/,
        "Should propagate adapter errors"
      );
    });
  });

  describe("Factory Pattern Benefits", () => {
    it("should enable testing with mocks", () => {
      const mockAdapters = {
        marketData: async () => [{ mock: true }],
        news: async () => [],
        llm: async () => [],
        mailer: async () => ({ success: true }),
      };

      const adapters = createAdapters(mockAdapters);

      // All adapters should be the mock versions
      assert.strictEqual(adapters.marketData, mockAdapters.marketData);
      assert.strictEqual(adapters.news, mockAdapters.news);
      assert.strictEqual(adapters.llm, mockAdapters.llm);
      assert.strictEqual(adapters.mailer, mockAdapters.mailer);
    });

    it("should enable swapping service implementations", () => {
      // Simulate swapping CoinGecko for CoinMarketCap
      const coinMarketCapAdapter = async () => [{ source: "CMC" }];

      const adapters = createAdapters({
        marketData: coinMarketCapAdapter,
      });

      assert.strictEqual(adapters.marketData, coinMarketCapAdapter,
        "Should allow swapping implementations");
    });

    it("should support spy/wrapper patterns", async () => {
      const calls = [];
      const originalAdapter = async (coinIds) => [{ id: coinIds[0] }];
      const spyAdapter = async (...args) => {
        calls.push(args);
        return originalAdapter(...args);
      };

      const adapters = createAdapters({ marketData: spyAdapter });
      await adapters.marketData(["bitcoin"]);

      assert.strictEqual(calls.length, 1);
      assert.deepStrictEqual(calls[0], [["bitcoin"]]);
    });
  });

  describe("Type Safety", () => {
    it("should accept async functions as adapters", () => {
      const asyncAdapter = async () => [];
      const adapters = createAdapters({ marketData: asyncAdapter });

      assert.ok(adapters.marketData.constructor.name === "AsyncFunction" ||
                adapters.marketData.constructor.name === "Function");
    });

    it("should accept regular functions that return promises", () => {
      const promiseAdapter = () => Promise.resolve([]);
      const adapters = createAdapters({ marketData: promiseAdapter });

      assert.strictEqual(typeof adapters.marketData, "function");
    });

    it("should accept arrow functions", () => {
      const arrowAdapter = async () => [];
      const adapters = createAdapters({ marketData: arrowAdapter });

      assert.strictEqual(typeof adapters.marketData, "function");
    });
  });
});
