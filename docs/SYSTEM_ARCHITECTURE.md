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
