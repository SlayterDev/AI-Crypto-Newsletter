import dotenv from "dotenv";

export function loadEnv() {
  const result = dotenv.config();

  if (result.error) {
    console.warn("Warning: .env file not found. Ensure environment variables are set.");
  }

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
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  console.log("Environment configuration loaded successfully");
}
