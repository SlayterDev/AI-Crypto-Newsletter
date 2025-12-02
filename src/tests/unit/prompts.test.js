/**
 * Unit Tests - Prompt Builder
 *
 * Tests pure string templating logic for LLM prompts
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { buildBatchPrompt, buildFunctionSchema } from "../../engine/prompts.js";

describe("Prompt Builder", () => {
  // Test fixtures
  const mockCorrelations = [
    {
      coin: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      currentPrice: 45000,
      priceChangePercentage24h: 5.2,
      direction: "up",
      relevantNews: [
        {
          title: "Bitcoin ETF sees record inflows",
          description: "Major institutional investment",
          source: "CoinDesk",
          url: "https://example.com/1",
        },
      ],
      fallbackSignals: [
        "Price increased by +5.20% in 24h",
        "24h trading volume: $28.0B",
      ],
      explanationBasis: "news",
    },
    {
      coin: "ethereum",
      symbol: "ETH",
      name: "Ethereum",
      currentPrice: 3200,
      priceChangePercentage24h: -2.8,
      direction: "down",
      relevantNews: [],
      fallbackSignals: [
        "Price decreased by -2.80% in 24h",
        "24h trading volume: $15.0B",
      ],
      explanationBasis: "signals",
    },
  ];

  describe("buildBatchPrompt()", () => {
    it("should generate a complete prompt for all coins", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(typeof prompt === "string", "Should return a string");
      assert.ok(prompt.length > 100, "Prompt should be substantial");
    });

    it("should include system instructions", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(prompt.includes("crypto market analyst"), "Should include role");
      assert.ok(prompt.includes("CRITICAL RULES"), "Should include rules");
      assert.ok(prompt.includes("NEVER speculate"), "Should include speculation warning");
      assert.ok(prompt.includes("NEVER give financial advice"), "Should warn against advice");
    });

    it("should include all coin sections", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(prompt.includes("Bitcoin (BTC)"), "Should include Bitcoin");
      assert.ok(prompt.includes("Ethereum (ETH)"), "Should include Ethereum");
    });

    it("should include price movement data", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(prompt.includes("increased by +5.20%"), "Should show BTC increase");
      assert.ok(prompt.includes("decreased by -2.80%"), "Should show ETH decrease");
      assert.ok(prompt.includes("$45,000"), "Should include BTC price");
      assert.ok(prompt.includes("$3,200"), "Should include ETH price");
    });

    it("should include relevant news when available", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(prompt.includes("Recent News"), "Should have news section");
      assert.ok(prompt.includes("Bitcoin ETF sees record inflows"), "Should include news title");
      assert.ok(prompt.includes("CoinDesk"), "Should include news source");
    });

    it("should include market indicators when basis is signals", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(prompt.includes("Market Indicators"), "Should have indicators section");
      assert.ok(prompt.includes("trading volume"), "Should include volume signal");
    });

    it("should include both news and signals when basis is 'both'", () => {
      const bothCorrelation = {
        ...mockCorrelations[0],
        explanationBasis: "both",
      };

      const prompt = buildBatchPrompt([bothCorrelation]);

      assert.ok(prompt.includes("Recent News"), "Should include news");
      assert.ok(prompt.includes("Market Indicators"), "Should include indicators");
    });

    it("should include JSON schema in prompt", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(prompt.includes("summaries"), "Should reference summaries array");
      assert.ok(prompt.includes("JSON"), "Should mention JSON format");
    });

    it("should instruct to handle insufficient data", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(prompt.includes("Insufficient data"), "Should mention insufficient data handling");
    });

    it("should throw error for empty correlations array", () => {
      assert.throws(
        () => buildBatchPrompt([]),
        /non-empty array/,
        "Should throw for empty array"
      );
    });

    it("should throw error for invalid input", () => {
      assert.throws(
        () => buildBatchPrompt(null),
        /non-empty array/,
        "Should throw for null"
      );

      assert.throws(
        () => buildBatchPrompt("not-array"),
        /non-empty array/,
        "Should throw for non-array"
      );
    });

    it("should format coin section with proper structure", () => {
      const prompt = buildBatchPrompt([mockCorrelations[0]]);

      // Check for section structure
      assert.ok(prompt.includes("---"), "Should use section separators");
      assert.ok(prompt.includes("Coin:"), "Should label coin");
      assert.ok(prompt.includes("Price Movement:"), "Should label movement");
      assert.ok(prompt.includes("Current Price:"), "Should label price");
    });

    it("should handle news with descriptions", () => {
      const prompt = buildBatchPrompt(mockCorrelations);

      assert.ok(prompt.includes("Major institutional investment"),
        "Should include news description");
    });

    it("should number news items sequentially", () => {
      const multiNewsCorrelation = {
        ...mockCorrelations[0],
        relevantNews: [
          { title: "News 1", source: "Source 1", description: "" },
          { title: "News 2", source: "Source 2", description: "" },
          { title: "News 3", source: "Source 3", description: "" },
        ],
      };

      const prompt = buildBatchPrompt([multiNewsCorrelation]);

      assert.ok(prompt.includes("1."), "Should number first news");
      assert.ok(prompt.includes("2."), "Should number second news");
      assert.ok(prompt.includes("3."), "Should number third news");
    });
  });

  describe("buildFunctionSchema()", () => {
    it("should return a valid OpenAI function schema", () => {
      const schema = buildFunctionSchema();

      assert.ok(schema.name, "Should have function name");
      assert.ok(schema.description, "Should have description");
      assert.ok(schema.parameters, "Should have parameters");
    });

    it("should specify function name", () => {
      const schema = buildFunctionSchema();

      assert.strictEqual(schema.name, "generate_summaries");
    });

    it("should define summaries array parameter", () => {
      const schema = buildFunctionSchema();

      assert.strictEqual(schema.parameters.type, "object");
      assert.ok(schema.parameters.properties.summaries);
      assert.strictEqual(schema.parameters.properties.summaries.type, "array");
    });

    it("should define required summary object properties", () => {
      const schema = buildFunctionSchema();
      const itemProperties = schema.parameters.properties.summaries.items.properties;

      assert.ok(itemProperties.coin, "Should have coin property");
      assert.ok(itemProperties.symbol, "Should have symbol property");
      assert.ok(itemProperties.summary, "Should have summary property");
    });

    it("should specify all properties as strings", () => {
      const schema = buildFunctionSchema();
      const itemProperties = schema.parameters.properties.summaries.items.properties;

      assert.strictEqual(itemProperties.coin.type, "string");
      assert.strictEqual(itemProperties.symbol.type, "string");
      assert.strictEqual(itemProperties.summary.type, "string");
    });

    it("should mark all properties as required", () => {
      const schema = buildFunctionSchema();
      const required = schema.parameters.properties.summaries.items.required;

      assert.ok(required.includes("coin"));
      assert.ok(required.includes("symbol"));
      assert.ok(required.includes("summary"));
    });

    it("should include property descriptions", () => {
      const schema = buildFunctionSchema();
      const itemProperties = schema.parameters.properties.summaries.items.properties;

      assert.ok(itemProperties.coin.description);
      assert.ok(itemProperties.symbol.description);
      assert.ok(itemProperties.summary.description);
    });

    it("should emphasize data-only summaries in description", () => {
      const schema = buildFunctionSchema();
      const summaryDesc = schema.parameters.properties.summaries.items.properties.summary.description;

      assert.ok(summaryDesc.includes("based only on provided data"),
        "Should emphasize using only provided data");
    });
  });

  describe("Edge Cases", () => {
    it("should handle correlation with no news and no description", () => {
      const minimalCorrelation = {
        coin: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        currentPrice: 45000,
        priceChangePercentage24h: 1.5,
        direction: "up",
        relevantNews: [],
        fallbackSignals: ["Price increased by +1.50% in 24h"],
        explanationBasis: "signals",
      };

      const prompt = buildBatchPrompt([minimalCorrelation]);

      assert.ok(prompt.includes("Bitcoin"), "Should include coin name");
      assert.ok(prompt.includes("Market Indicators"), "Should show signals");
    });

    it("should handle very long news titles", () => {
      const longTitleCorrelation = {
        ...mockCorrelations[0],
        relevantNews: [{
          title: "A".repeat(200),
          source: "Test",
          description: "",
        }],
      };

      const prompt = buildBatchPrompt([longTitleCorrelation]);

      assert.ok(prompt.length > 100, "Should handle long titles");
      assert.ok(prompt.includes("A".repeat(200)), "Should include full title");
    });

    it("should handle multiple coins with different explanation bases", () => {
      const mixedCorrelations = [
        { ...mockCorrelations[0], explanationBasis: "news" },
        { ...mockCorrelations[1], explanationBasis: "signals" },
        { ...mockCorrelations[0], symbol: "SOL", explanationBasis: "both" },
      ];

      const prompt = buildBatchPrompt(mixedCorrelations);

      // Should include appropriate sections for each basis
      const newsCount = (prompt.match(/Recent News/g) || []).length;
      const indicatorsCount = (prompt.match(/Market Indicators/g) || []).length;

      assert.ok(newsCount >= 2, "Should have news sections");
      assert.ok(indicatorsCount >= 2, "Should have indicator sections");
    });
  });
});
