import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 45000;

/**
 * Generates summaries using OpenAI with structured outputs
 * @param {string} prompt - The complete prompt for all coins
 * @param {Object} functionSchema - The function calling schema for structured output
 * @param {Array} expectedCoins - Array of expected coin symbols for validation
 * @returns {Promise<Array>} Array of summary objects
 */
export default async function generateSummaries(prompt, functionSchema, expectedCoins) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("prompt must be a non-empty string");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const maxRetries = parseInt(process.env.MAX_RETRIES || DEFAULT_MAX_RETRIES, 10);
  const retryDelay = parseInt(process.env.RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS, 10);

  return await generateWithRetry(prompt, functionSchema, expectedCoins, apiKey, maxRetries, retryDelay);
}

/**
 * Generates summaries with exponential backoff retry logic
 */
async function generateWithRetry(prompt, functionSchema, expectedCoins, apiKey, maxRetries, baseDelay) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await performGeneration(prompt, functionSchema, expectedCoins, apiKey);
    } catch (error) {
      lastError = error;

      // Don't retry on configuration or client errors
      if (error.status && error.status >= 400 && error.status < 500) {
        console.error("OpenAI API client error (not retrying):", error.message);
        throw error;
      }

      // Retry on network errors or server errors
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(
          `OpenAI API request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
          error.message
        );
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  console.error("OpenAI API request failed after all retries");
  throw lastError;
}

/**
 * Performs the actual OpenAI API request with structured outputs
 */
async function performGeneration(prompt, functionSchema, expectedCoins, apiKey) {
  const openai = new OpenAI({
    apiKey,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || DEFAULT_TEMPERATURE);
  const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || DEFAULT_MAX_TOKENS, 10);

  console.log(`Calling OpenAI API (model: ${model})...`);

  const response = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    functions: [functionSchema],
    function_call: { name: functionSchema.name },
  });

  // Extract function call response
  const functionCall = response.choices[0]?.message?.function_call;
  if (!functionCall || !functionCall.arguments) {
    throw new Error("OpenAI did not return expected function call response");
  }

  // Parse JSON response
  let parsedResponse;
  try {
    parsedResponse = JSON.parse(functionCall.arguments);
  } catch (error) {
    console.error("Failed to parse OpenAI response as JSON:", functionCall.arguments);
    throw new Error("Invalid JSON response from OpenAI");
  }

  // Validate response structure
  if (!parsedResponse.summaries || !Array.isArray(parsedResponse.summaries)) {
    throw new Error("OpenAI response missing 'summaries' array");
  }

  // Validate all expected coins are present
  validateResponse(parsedResponse.summaries, expectedCoins);

  // Check for forbidden phrases
  checkForForbiddenContent(parsedResponse.summaries);

  console.log(`Successfully generated ${parsedResponse.summaries.length} summaries`);

  return parsedResponse.summaries;
}

/**
 * Validates that response contains all expected coins
 */
function validateResponse(summaries, expectedCoins) {
  const returnedCoins = summaries.map((s) => s.symbol);
  const missing = expectedCoins.filter((coin) => !returnedCoins.includes(coin));

  if (missing.length > 0) {
    console.warn(`Warning: OpenAI response missing summaries for: ${missing.join(", ")}`);
    // Don't throw - partial results are better than nothing
  }

  // Validate each summary has required fields
  summaries.forEach((summary, index) => {
    if (!summary.coin || !summary.symbol || !summary.summary) {
      throw new Error(`Summary at index ${index} is missing required fields`);
    }
  });
}

/**
 * Checks for forbidden content in summaries
 */
function checkForForbiddenContent(summaries) {
  const forbiddenPhrases = [
    /\bi predict\b/i,
    /\byou should\b/i,
    /\bwill (increase|decrease|rise|fall|go up|go down)\b/i,
    /\bbuy\b/i,
    /\bsell\b/i,
    /\bhold\b/i,
    /\binvest(ment)?\b/i,
    /\brecommend\b/i,
  ];

  summaries.forEach((summary) => {
    forbiddenPhrases.forEach((pattern) => {
      if (pattern.test(summary.summary)) {
        console.warn(
          `Warning: Summary for ${summary.symbol} contains potentially speculative content: "${summary.summary}"`
        );
      }
    });
  });
}

/**
 * Utility function to sleep for a specified duration
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
