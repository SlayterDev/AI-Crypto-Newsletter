import dotenv from "dotenv";

export function loadEnv() {
  // Try to load .env file (for local development)
  // In Docker, env vars are injected directly, so this is optional
  dotenv.config();

  // Validate required environment variables
  const required = [
    "OPENAI_API_KEY",
    "COINGECKO_API_KEY",
    "CRYPTOPANIC_API_KEY",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "FROM_EMAIL",
    "TO_EMAILS",
    "COINS",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      `Tip: Copy .env.example to .env and configure your API keys.`
    );
  }

  const source = process.env.NODE_ENV === "production" ? "environment" : ".env file";
  console.log(`Environment configuration loaded successfully from ${source}`);
}
