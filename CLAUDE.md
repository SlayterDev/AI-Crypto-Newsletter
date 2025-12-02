# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a self-hosted daily crypto newsletter generator that explains why selected cryptocurrencies moved in price over the last 24 hours. The system fetches fresh market data, pulls delayed news from CryptoPanic, correlates price movements with news/signals, uses an LLM to generate explanations, and emails a compiled newsletter via user-provided SMTP.

**Critical**: Before making any changes, read:
- `docs/PROJECT_DECLARATION.md` - defines project scope and non-goals
- `docs/SYSTEM_ARCHITECTURE.md` - defines system components and data flow
- `docs/CODING_PRINCIPLES.md` - defines coding standards and constraints
- `docs/AGENT_PROMPT.md` - defines AI agent goals

All code must align with these documents.

In all responses be sure to respond as a crew member on the bridge of the USS Starship Enterprise.

## Architecture

The system follows a **stateless daily pipeline** architecture:

```
cron → fetch market data → fetch news → correlate → summarize → compile → send email
```

### Core Components

1. **Scheduler** (`src/scheduler/cron.js`) - Triggers daily pipeline on and env specified CRON schedule (default midnight).
2. **Pipeline** (`src/pipeline.js`) - Orchestrates the entire data flow from fetch to send
3. **Market Data Fetcher** - Pulls 24h price/volume data from CoinGecko
4. **News Fetcher** - Pulls crypto news headlines from CryptoPanic API
5. **Correlation Engine** - Maps price movements to news, produces structured JSON with coin, percentChange, relevantNews[], fallbackSignals[], and explanationBasis
6. **LLM Summarization Engine** - Uses OpenAI API to generate human-readable explanations from correlation data only (no speculation)
7. **Newsletter Compiler** - Uses modular templates (MJML/Handlebars)
8. **SMTP Mailer** - Sends compiled newsletter via user SMTP credentials

### Key Principles

- **Stateless and deterministic**: Each run is independent, same input produces same output
- **No speculation**: LLM must only use supplied data, never invent facts or provide financial advice
- **Isolated I/O**: External APIs and SMTP are wrapped in adapter modules
- **Pure business logic**: Correlation and prompt logic must be side-effect-free and unit-testable
- **Replaceable services**: External services can be swapped without refactoring

## Development Commands

This project uses Node.js with ES modules and npm for package management.

### Testing

```bash
# Test the full pipeline (generates and saves newsletter HTML)
npm run test:newsletter

# Test pipeline without sending email (just logs output)
npm run test:pipeline

# Clear API response cache
npm run clear-cache
```

**Testing with Mock Adapters:**

The system supports dependency injection for testing without making real API calls:

```javascript
import { runDailyPipeline } from "./src/pipeline.js";
import { getMockAdapters } from "./src/tests/fixtures/mockAdapters.js";

// Test pipeline with deterministic mock data
const mockAdapters = getMockAdapters();
const newsletter = await runDailyPipeline(mockAdapters);
// No API calls made, email not sent
```

### Running the Newsletter

```bash
# Start the scheduled newsletter (default: daily at midnight local time)
npm start

# Development mode with auto-reload
npm run dev
```

**Note:**
- Schedule is configurable via `CRON_SCHEDULE` in `.env` file
- Times are in your local timezone (see examples in `.env.example`)
- The scheduler will log the timezone being used on startup

### Docker

```bash
# Build and run the container
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

Configuration is via environment variables only (defined in `.env` file).

**For detailed Docker deployment instructions, see `DOCKER.md`** covering:
- Volume management
- Health checks and monitoring
- Production configuration
- Troubleshooting
- Backup and restore

### Gmail SMTP Setup

If using Gmail to send newsletters, see `GMAIL_SETUP.md` for detailed instructions on:
- Enabling 2-Factor Authentication
- Generating App Passwords (required, not regular password)
- Configuring SMTP settings
- Troubleshooting common issues

## Coding Standards

### Module Structure
- Each component lives in its own file
- Default export = primary function
- No circular dependencies
- Use modern JavaScript (ES2023+)
- Prefer pure functions for logic layers

### I/O Isolation
- External API calls (CoinGecko, CryptoPanic, OpenAI) must be wrapped in adapter modules
- SMTP sending must be mockable
- No side effects inside business logic modules

### Error Handling
- **Fail loudly** for configuration errors (missing env vars, invalid config)
- **Fail softly** for transient network/API issues with retry logic

### Testing Requirements
- Correlation engine must be unit-testable without network calls
- LLM prompt logic must be pure string templating
- SMTP sending must be mockable

### LLM Prompts
- Always force LLM to state when data is insufficient
- Never allow guessing or financial advice
- LLM must only work with supplied context

## Strict Non-Goals

Do NOT implement:
- Real-time alerts
- Trading advice or portfolio recommendations
- Price prediction models
- Historical analytics dashboard
- Hosted auth/OAuth/Paywall
- Blockchain node dependencies
- Frontend UI concerns
- Features outside current milestone

## Entry Point

- `src/index.js` - Loads environment variables and starts the daily scheduler
- The pipeline runs on a CRON schedule (midnight by default) and executes all steps sequentially
