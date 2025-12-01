/**
 * Prompt Builder - Pure string templating for LLM prompts
 *
 * All functions are pure (no side effects) and deterministic.
 */

/**
 * Builds a batched prompt for all coins
 * @param {Array} correlations - Array of correlation objects
 * @returns {string} Complete prompt for OpenAI
 */
export function buildBatchPrompt(correlations) {
  if (!Array.isArray(correlations) || correlations.length === 0) {
    throw new Error("correlations must be a non-empty array");
  }

  const systemInstructions = buildSystemInstructions();
  const coinSections = correlations.map(formatCoinSection).join("\n");
  const jsonSchema = buildJsonSchema(correlations);

  return `${systemInstructions}

Explain the price movements for the following cryptocurrencies in the last 24 hours.

${coinSections}

Return your analysis as a JSON object with a "summaries" array matching this structure:
${jsonSchema}

Remember: Only use the data provided. If data is insufficient for any coin, state "Insufficient data to explain this movement" in the summary.`;
}

/**
 * Builds system instructions for the LLM
 */
function buildSystemInstructions() {
  return `You are a crypto market analyst explaining price movements to newsletter subscribers.

CRITICAL RULES:
- Analyze ALL coins provided below
- ONLY use the data provided for each coin
- If data is insufficient for a coin, state "Insufficient data to explain this movement"
- NEVER speculate about future price movements
- NEVER give financial advice (buy/sell/hold recommendations)
- NEVER predict what will happen next
- Be concise: 3-4 sentences per coin maximum
- Focus on facts: cite news sources when available
- Return properly formatted JSON as specified`;
}

/**
 * Formats a single coin's data into a prompt section
 */
function formatCoinSection(correlation) {
  const direction = correlation.direction === "up" ? "increased" : "decreased";
  const sign = correlation.priceChangePercentage24h >= 0 ? "+" : "";

  let section = `---
Coin: ${correlation.name} (${correlation.symbol})
Price Movement: ${direction} by ${sign}${correlation.priceChangePercentage24h.toFixed(2)}%
Current Price: $${correlation.currentPrice.toLocaleString()}
`;

  // Add news if available
  if (correlation.relevantNews && correlation.relevantNews.length > 0) {
    section += "\nRecent News:\n";
    correlation.relevantNews.forEach((news, index) => {
      section += `${index + 1}. [${news.source}] ${news.title}\n`;
      if (news.description) {
        section += `   ${news.description}\n`;
      }
    });
  }

  // Add market indicators if using signals
  if (correlation.explanationBasis === "signals" || correlation.explanationBasis === "both") {
    section += "\nMarket Indicators:\n";
    correlation.fallbackSignals.forEach((signal) => {
      section += `- ${signal}\n`;
    });
  }

  section += "\n";
  return section;
}

/**
 * Builds the expected JSON schema for the response
 */
function buildJsonSchema(correlations) {
  const example = correlations.slice(0, 1).map(c => ({
    coin: c.coin,
    symbol: c.symbol,
    summary: "Brief 3-4 sentence explanation based on provided data"
  }));

  return JSON.stringify({
    summaries: example.concat([{ "...": "summaries for remaining coins" }])
  }, null, 2);
}

/**
 * Builds the function calling schema for structured outputs
 */
export function buildFunctionSchema() {
  return {
    name: "generate_summaries",
    description: "Generate price movement summaries for multiple cryptocurrencies",
    parameters: {
      type: "object",
      properties: {
        summaries: {
          type: "array",
          description: "Array of summaries, one for each cryptocurrency",
          items: {
            type: "object",
            properties: {
              coin: {
                type: "string",
                description: "Coin ID (e.g., 'bitcoin')"
              },
              symbol: {
                type: "string",
                description: "Coin symbol (e.g., 'BTC')"
              },
              summary: {
                type: "string",
                description: "3-4 sentence explanation of price movement based only on provided data"
              }
            },
            required: ["coin", "symbol", "summary"]
          }
        }
      },
      required: ["summaries"]
    }
  };
}
