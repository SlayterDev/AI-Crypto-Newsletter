import fetchMarketData from "./adapters/coingecko.js";
import fetchNews from "./adapters/cryptopanic.js";

export async function runDailyPipeline() {
  console.log("Pipeline execution started...");

  try {
    // Step 1: Fetch market data
    const coinIds = process.env.COINS.split(",").map((coin) => coin.trim());
    console.log(`Fetching market data for: ${coinIds.join(", ")}`);

    const marketData = await fetchMarketData(coinIds);
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

    const newsData = await fetchNews(coinSymbols, 48);
    console.log(`Successfully fetched ${newsData.length} news articles from the last 24 hours`);

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

    // TODO: Step 3: Correlate price movements with news
    // TODO: Step 4: Generate LLM summaries
    // TODO: Step 5: Compile newsletter
    // TODO: Step 6: Send email

    console.log("\nPipeline execution completed successfully");
  } catch (error) {
    console.error("Pipeline execution failed:", error.message);
    throw error;
  }
}
