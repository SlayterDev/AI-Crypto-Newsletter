/**
 * Mock OpenAI Adapter - Returns deterministic summaries without API calls
 * Use for testing pipeline and compilation logic
 */

/**
 * Mock implementation of generateSummaries
 * @param {string} prompt - The prompt (ignored in mock)
 * @param {Object} functionSchema - The function schema (used for structure)
 * @param {Array} expectedCoins - Array of expected coin symbols
 * @returns {Promise<Array>} Mock summaries
 */
export default async function mockGenerateSummaries(prompt, functionSchema, expectedCoins) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("prompt must be a non-empty string");
  }

  // Simulate LLM processing delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Return deterministic mock summaries
  const mockSummaries = {
    BTC: "Bitcoin rose 5.2% following record ETF inflows as institutional investors increased their exposure to the cryptocurrency. Strong buying pressure from traditional finance drove the rally.",
    ETH: "Ethereum declined 2.8% despite a successful network upgrade that reduced gas fees. Profit-taking after recent gains offset the positive technical development.",
    SOL: "Solana surged 8.5% on news of a major partnership with a payment processor. The announcement strengthened investor confidence in the network's growing ecosystem.",
  };

  // Return summaries for expected coins (must match OpenAI adapter structure)
  return expectedCoins.map((symbol) => ({
    symbol: symbol,
    summary: mockSummaries[symbol] || `${symbol} moved due to general market conditions. Limited specific news available for this asset.`,
  }));
}
