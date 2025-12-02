import createAdapters from "./adapters/factory.js";
import correlateData from "./engine/correlate.js";
import generateSummaries from "./engine/summarize.js";
import compileNewsletter from "./compiler/newsletter.js";

/**
 * Runs the daily newsletter pipeline with injected adapters
 * @param {Object} adapters - Adapter set (marketData, news, llm, mailer)
 * @returns {Promise<string>} Compiled newsletter HTML
 */
export async function runDailyPipeline(adapters = createAdapters()) {
  console.log("Pipeline execution started...");

  try {
    // Step 1: Fetch market data
    const coinIds = process.env.COINS.split(",").map((coin) => coin.trim());
    console.log(`Fetching market data for: ${coinIds.join(", ")}`);

    const marketData = await adapters.marketData(coinIds);
    console.log(`Successfully fetched data for ${marketData.length} coins`);

    // Log each coin's data
    marketData.forEach((coin) => {
      const direction = coin.priceChangePercentage24h >= 0 ? "↑" : "↓";
      console.log(
        `${coin.symbol}: $${coin.currentPrice.toLocaleString()} ${direction} ${coin.priceChangePercentage24h.toFixed(2)}%`
      );
    });

    // Step 2: Fetch news data
    const coinSymbols = marketData.map((coin) => coin.symbol);
    console.log(`\nFetching news for: ${coinSymbols.join(", ")}`);

    const newsData = await adapters.news(coinSymbols, 48);
    console.log(`Successfully fetched ${newsData.length} news articles from the last 48 hours`);

    // Log news summary
    if (newsData.length > 0) {
      console.log("\nRecent news headlines:");
      newsData.slice(0, 5).forEach((news) => {
        const coins = news.currencies.join(", ");
        console.log(`  [${coins}] ${news.title}`);
        console.log(`    Source: ${news.source} | ${new Date(news.publishedAt).toLocaleString()}`);
      });
      if (newsData.length > 5) {
        console.log(`  ... and ${newsData.length - 5} more articles`);
      }
    } else {
      console.log("No recent news found for tracked coins");
    }

    // Step 3: Correlate price movements with news
    console.log("\nCorrelating market data with news...");
    const correlations = correlateData(marketData, newsData);
    console.log(`Generated correlation data for ${correlations.length} coins`);

    // Log correlation summary
    console.log("\nCorrelation summary:");
    correlations.forEach((correlation) => {
      const direction = correlation.direction === "up" ? "↑" : "↓";
      console.log(
        `\n${correlation.symbol} (${correlation.name}) ${direction} ${correlation.priceChangePercentage24h.toFixed(2)}%`
      );
      console.log(`  Relevant news: ${correlation.relevantNews.length} articles`);
      console.log(`  Explanation basis: ${correlation.explanationBasis}`);

      if (correlation.relevantNews.length > 0) {
        console.log(`  Top headline: "${correlation.relevantNews[0].title}"`);
      }
    });

    // Step 4: Generate LLM summaries
    console.log("\nGenerating LLM summaries...");
    const summaries = await generateSummaries(correlations, adapters.llm);
    console.log(`Successfully generated ${summaries.length} summaries`);

    // Log summaries
    console.log("\nGenerated summaries:");
    summaries.forEach((summary) => {
      console.log(`\n${summary.symbol}:`);
      console.log(`  ${summary.summary}`);
    });

    // Step 5: Compile newsletter
    console.log("\nCompiling newsletter...");
    const newsletterHtml = compileNewsletter(summaries, correlations);
    console.log(`Newsletter compiled (${newsletterHtml.length} characters)`);

    // Step 6: Send email
    console.log("\nSending newsletter via email...");
    const sendResult = await adapters.mailer(newsletterHtml);

    if (sendResult.success) {
      if (sendResult.dryRun) {
        console.log("Newsletter prepared (DRY_RUN mode - not sent)");
      } else {
        console.log(`Newsletter sent successfully to ${sendResult.recipients.length} recipient(s)`);
        console.log(`Message ID: ${sendResult.messageId}`);
      }
    }

    console.log("\nPipeline execution completed successfully");

    return newsletterHtml; // Return for testing/debugging
  } catch (error) {
    console.error("Pipeline execution failed:", error.message);
    throw error;
  }
}
