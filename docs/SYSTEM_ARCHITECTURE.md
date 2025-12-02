# System Architecture

## Container Overview
A single Docker container running a Node.js service with a daily scheduler.

## Components
1. Scheduler
   - Triggers daily pipeline using cron

2. Market Data Fetcher
   - Pulls fresh 24h price, volume, and market signals
   - Source: CoinGecko

3. News Fetcher
   - Pulls crypto news headlines
   - Source: CryptoPanic API

4. Correlation Engine
   - Maps price direction ↔ news or fallback signals
   - Produces structured JSON:
     {
       coin,
       percentChange,
       relevantNews[],
       fallbackSignals[],
       explanationBasis
     }

5. LLM Summarization Engine
   - Uses OpenAI API
   - Consumes correlation JSON
   - Generates human-readable explanation from data only
   - Must not invent facts outside provided context

6. Newsletter Compiler
   - Uses modular email templates (MJML/Handlebars)

7. SMTP Mailer
   - Sends the compiled newsletter via existing user SMTP creds

## Data Flow

cron → fetch market data → fetch news → correlate → summarize → compile → send email

## Architectural Principles
- Stateless daily pipeline
- Deterministic input → output
- No speculative reasoning beyond data supplied
- Replaceable external services without refactors

## Dependency Injection Pattern

The system uses a **factory pattern with dependency injection** to decouple business logic from external I/O adapters.

### Adapter Factory
- Located at `src/adapters/factory.js`
- Creates adapter sets with optional overrides
- Default adapters: CoinGecko, CryptoPanic, OpenAI, SMTP

### Production Usage
```javascript
import createAdapters from "./adapters/factory.js";

// Use defaults (production adapters)
const adapters = createAdapters();

// Or override specific adapters
const adapters = createAdapters({
  marketData: customCoinMarketCapAdapter,
  // ... others use defaults
});

await runDailyPipeline(adapters);
```

### Testing Usage
```javascript
import { getMockAdapters } from "./tests/fixtures/mockAdapters.js";

// Use deterministic mocks (no API calls)
const mockAdapters = getMockAdapters();
await runDailyPipeline(mockAdapters);
```

### Available Adapters

**Production Adapters** (`src/adapters/`):
- `coingecko.js` - Fetches market data from CoinGecko API
- `cryptopanic.js` - Fetches news from CryptoPanic API
- `openai.js` - Generates summaries using OpenAI GPT
- `smtp.js` - Sends emails via SMTP (nodemailer)

**Mock Adapters** (`src/adapters/__mocks__/`):
- `mockMarketData.js` - Returns deterministic market data
- `mockNews.js` - Returns deterministic news articles
- `mockOpenAI.js` - Returns deterministic summaries
- `mockSMTP.js` - Simulates email sending

### Swapping Adapters

To replace an external service:
1. Create new adapter with same function signature
2. Inject via factory: `createAdapters({ marketData: newAdapter })`
3. No changes to pipeline or engine code required

Example: Switching from CoinGecko to CoinMarketCap
```javascript
// src/adapters/coinmarketcap.js
export default async function fetchMarketData(coinIds) {
  // ... CoinMarketCap implementation
  return marketData; // Same shape as CoinGecko
}

// src/index.js
import createAdapters from "./adapters/factory.js";
import fetchMarketDataCMC from "./adapters/coinmarketcap.js";

const adapters = createAdapters({ marketData: fetchMarketDataCMC });
scheduleDailyJob(adapters);
```
