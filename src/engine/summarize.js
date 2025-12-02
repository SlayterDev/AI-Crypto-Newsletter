/**
 * Summarization Engine Orchestrator
 *
 * Coordinates prompt building and LLM API calls to generate summaries
 */

import { buildBatchPrompt, buildFunctionSchema } from "./prompts.js";
import generateSummariesAPI from "../adapters/openai.js";

/**
 * Generates summaries for all correlations in a single batched API call
 * @param {Array} correlations - Array of correlation objects
 * @param {Function} llmAdapter - LLM adapter function (default: OpenAI)
 * @returns {Promise<Array>} Array of summary objects with timestamps
 */
export default async function generateSummaries(correlations, llmAdapter = generateSummariesAPI) {
  if (!Array.isArray(correlations) || correlations.length === 0) {
    throw new Error("correlations must be a non-empty array");
  }

  console.log(`Generating summaries for ${correlations.length} coins...`);

  // Step 1: Build batched prompt
  const prompt = buildBatchPrompt(correlations);

  // Step 2: Build function schema for structured outputs
  const functionSchema = buildFunctionSchema();

  // Step 3: Extract expected coin symbols for validation
  const expectedCoins = correlations.map((c) => c.symbol);

  // Step 4: Call LLM API
  const summaries = await llmAdapter(prompt, functionSchema, expectedCoins);

  // Step 5: Add timestamps to all summaries
  const timestamp = new Date().toISOString();
  const summariesWithTimestamp = summaries.map((summary) => ({
    ...summary,
    generatedAt: timestamp,
  }));

  return summariesWithTimestamp;
}
