# Crypto Daily Newsletter — Project Declaration

## Purpose
Generate a self-hosted daily newsletter that explains why selected cryptocurrencies moved in price over the last 24 hours. Uses fresh price data + delayed news + structured LLM summarization.

## Audience
Crypto-curious users who want causal explanations for price changes without researching news or tracking multiple feeds.

## Scope
- Users subscribe with an email + list of coins
- System fetches market data daily
- System fetches news headlines (24h delayed from CryptoPanic)
- Correlation engine maps price movements to news/signals
- LLM produces short blurbs explaining price deltas
- Newsletter is compiled and emailed via user-provided SMTP

## Non-Goals (Do Not Implement)
- No real-time alerts
- No trading advice or portfolio recommendations
- No price prediction models
- No historical analytics dashboard
- No hosted auth/OAuth/Paywall (future phase)
- No blockchain node dependencies

## Technology Stack
- Node.js backend
- Docker container deployment
- SMTP email delivery
- External APIs: CoinGecko, CryptoPanic (and optional sentiment/on-chain APIs)
- Optional DB: SQLite if persistence is needed

## Success Criteria
- Repeatable daily job runs without manual intervention
- Newsletter contains price changes + plausible causal narratives
- No hallucinated explanations (must rely on supplied data)
