/**
 * Test Fixtures - Mock Adapters
 *
 * Pre-configured mock adapter sets for testing pipeline and engine logic
 * without making actual API calls or sending emails.
 *
 * Usage:
 *   import { getMockAdapters } from './tests/fixtures/mockAdapters.js';
 *   const adapters = getMockAdapters();
 *   await runDailyPipeline(adapters);
 */

import mockFetchMarketData from "../../adapters/__mocks__/mockMarketData.js";
import mockFetchNews from "../../adapters/__mocks__/mockNews.js";
import mockGenerateSummaries from "../../adapters/__mocks__/mockOpenAI.js";
import mockSendNewsletter from "../../adapters/__mocks__/mockSMTP.js";
import createAdapters from "../../adapters/factory.js";

/**
 * Returns a complete set of mock adapters for testing
 * @returns {Object} Mock adapter set
 */
export function getMockAdapters() {
  return createAdapters({
    marketData: mockFetchMarketData,
    news: mockFetchNews,
    llm: mockGenerateSummaries,
    mailer: mockSendNewsletter,
  });
}

/**
 * Returns mock adapters with custom overrides
 * @param {Object} overrides - Custom adapter implementations
 * @returns {Object} Mock adapter set with overrides
 */
export function getMockAdaptersWithOverrides(overrides = {}) {
  const defaults = {
    marketData: mockFetchMarketData,
    news: mockFetchNews,
    llm: mockGenerateSummaries,
    mailer: mockSendNewsletter,
  };

  return createAdapters({ ...defaults, ...overrides });
}

/**
 * Example: Spy adapters that track calls while using mocks
 */
export function getSpyAdapters() {
  const calls = {
    marketData: [],
    news: [],
    llm: [],
    mailer: [],
  };

  return {
    adapters: createAdapters({
      marketData: async (...args) => {
        calls.marketData.push(args);
        return mockFetchMarketData(...args);
      },
      news: async (...args) => {
        calls.news.push(args);
        return mockFetchNews(...args);
      },
      llm: async (...args) => {
        calls.llm.push(args);
        return mockGenerateSummaries(...args);
      },
      mailer: async (...args) => {
        calls.mailer.push(args);
        return mockSendNewsletter(...args);
      },
    }),
    calls,
  };
}

export default getMockAdapters;
