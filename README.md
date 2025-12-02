# AI Crypto Newsletter

This is a self-hosted daily newsletter that sends you a summarized explanation of price changes for the coins of your choice. The application is built with Node.js and can be deployed with docker. The application uses CoinGecko for price data, CryptoPanic for news sources, and OpenAI to generate summaries. If you use a free API key from CryptoPanic there's a limitation that their API will only return articles older than 24 hours. Please take this into account when reading summaries. You should not use this tool for financial advice and should do your own research before making any market decisions.

![Screenshot](/docs/Screenshot.png)

## Installation

### Pre-requisites
- [CoinGecko](https://www.coingecko.com/en/api) API key (Price data)
- [CryptoPanic](https://cryptopanic.com/developers/api/about) API key (News source)
- [OpenAI](https://platform.openai.com) API key (Summary generation)
- Docker 20.10+ installed

### Docker Setup
1. Clone this repo to your machine
2. Copy `.env.example` to a new `.env` file
3. Fill in the API keys
4. Fill in your SMTP server settings. AI generated gmail instrctions can be found [here](/docs/GMAIL_SETUP.md).
5. Fill in the email you would like to receive the newsletter at in `TO_EMAILS`. This can be a single email or a comma separated list.
6. Customize the coins you would like to track in the `COINS` variable. Use the full name of the coin comma separated. Note that adding more coins can increase your OpenAI usage.
    - For Example: `COINS=bitcoin,dogecoin,ethereum`
7. **Optional:** Customize `CRON_SCHEDULE`. It will send the email at midnight by default.
8. **Optional:** Customize the title of your newsletter by changing `NEWSLETTER_TITLE`
9. Run `docker-compose up -d`

The container should be running and your daily email will be generated on schedule.

You can find more (AI generated) details in [Docker.md](/docs/DOCKER.md) and [GMAIL_SETUP.md](/docs/GMAIL_SETUP.md).

## Developer Onboarding

Before making changes, read:

- [`docs/PROJECT_DECLARATION.md`](/docs/PROJECT_DECLARATION.md)
- [`docs/SYSTEM_ARCHITECTURE.md`](/docs/SYSTEM_ARCHITECTURE.md)
- [`docs/CODING_PRINCIPLES.md`](/docs/CODING_PRINCIPLES.md)
- [`docs/AGENT_PROMPT.md`](/docs/AGENT_PROMPT.md)

These documents define scope, architecture, and coding guidelines. 
All code must be consistent with them. This is mostly for AI agents but can help understand the architecture of the application.

## Support

Feel free to open issues or pull requests and I'll do what I can. If you enjoy this tool please consider sending a small tip to keep things going.

- BTC: bc1q7q4qs53qldampwlqr55xlrh7vsf9pxl3p4wwcr
- ETH: 0x9c633c70aAEEb4624F95D17ab95a255156556a8D
- DOGE: D7ZwkSMtUSKg6HNV93eeZUDheA16qDckfs

[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-donate-yellow.svg)](https://buymeacoffee.com/slayterdev)
