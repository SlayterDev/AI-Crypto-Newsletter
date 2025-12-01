/**
 * SMTP Adapter - Sends newsletters via email using nodemailer
 *
 * Isolated I/O module for email sending
 */

import nodemailer from "nodemailer";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 2000;

/**
 * Sends newsletter via email to configured recipients
 * @param {string} htmlContent - Compiled newsletter HTML
 * @returns {Promise<Object>} Send status object
 */
export default async function sendNewsletter(htmlContent) {
  if (!htmlContent || typeof htmlContent !== "string") {
    throw new Error("htmlContent must be a non-empty string");
  }

  // Validate required environment variables
  validateConfig();

  // Check for dry run mode
  const dryRun = process.env.DRY_RUN === "true";
  if (dryRun) {
    console.log("DRY_RUN mode enabled - email will not be sent");
    return performDryRun(htmlContent);
  }

  const maxRetries = parseInt(process.env.MAX_RETRIES || DEFAULT_MAX_RETRIES, 10);
  const retryDelay = parseInt(process.env.RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS, 10);

  return await sendWithRetry(htmlContent, maxRetries, retryDelay);
}

/**
 * Validates SMTP configuration
 */
function validateConfig() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "FROM_EMAIL", "TO_EMAILS"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  // Validate port is a number
  const port = parseInt(process.env.SMTP_PORT, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid SMTP_PORT: ${process.env.SMTP_PORT}`);
  }
}

/**
 * Sends email with exponential backoff retry logic
 */
async function sendWithRetry(htmlContent, maxRetries, baseDelay) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await performSend(htmlContent);
    } catch (error) {
      lastError = error;

      // Don't retry on authentication or configuration errors
      if (isNonRetryableError(error)) {
        console.error("SMTP error (not retrying):", error.message);
        throw error;
      }

      // Retry on network errors or server errors
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `SMTP send failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
          error.message
        );
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  console.error("SMTP send failed after all retries");
  throw lastError;
}

/**
 * Performs the actual email send
 */
async function performSend(htmlContent) {
  console.log("Connecting to SMTP server...");

  // Create transporter
  const transporter = createTransporter();

  // Verify connection
  try {
    await transporter.verify();
    console.log("SMTP connection verified");
  } catch (error) {
    throw new Error(`SMTP connection failed: ${error.message}`);
  }

  // Parse recipients
  const recipients = parseRecipients(process.env.TO_EMAILS);

  // Generate subject
  const subject = generateSubject();

  // Prepare email options
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: recipients.join(", "),
    subject,
    html: htmlContent,
  };

  console.log(`Sending newsletter to ${recipients.length} recipient(s)...`);

  // Send email
  const info = await transporter.sendMail(mailOptions);

  console.log(`Email sent successfully: ${info.messageId}`);

  return {
    success: true,
    messageId: info.messageId,
    recipients,
    sentAt: new Date().toISOString(),
  };
}

/**
 * Creates nodemailer transporter
 */
function createTransporter() {
  const port = parseInt(process.env.SMTP_PORT, 10);
  const secure = port === 465; // true for 465, false for other ports

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Parses and validates recipient email addresses
 */
function parseRecipients(recipientsString) {
  const recipients = recipientsString
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("No valid recipients found in TO_EMAILS");
  }

  // Basic email validation
  recipients.forEach((email) => {
    if (!isValidEmail(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
  });

  return recipients;
}

/**
 * Basic email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates subject line with current date
 */
function generateSubject() {
  const title = process.env.NEWSLETTER_TITLE || "Crypto Daily Newsletter";
  const date = formatDate(new Date());
  return `${title} - ${date}`;
}

/**
 * Formats date for subject line
 */
function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Checks if error is non-retryable
 */
function isNonRetryableError(error) {
  const errorMessage = error.message.toLowerCase();

  // Authentication failures
  if (errorMessage.includes("invalid login") || errorMessage.includes("authentication failed")) {
    return true;
  }

  // Invalid credentials
  if (errorMessage.includes("invalid credentials") || errorMessage.includes("username and password not accepted")) {
    return true;
  }

  // Configuration errors
  if (errorMessage.includes("connection refused") && error.errno === "ECONNREFUSED") {
    return true; // Wrong host/port
  }

  return false;
}

/**
 * Performs a dry run (logs without sending)
 */
function performDryRun(htmlContent) {
  console.log("\n=== DRY RUN MODE ===");
  console.log(`From: ${process.env.FROM_EMAIL}`);
  console.log(`To: ${process.env.TO_EMAILS}`);
  console.log(`Subject: ${generateSubject()}`);
  console.log(`HTML Length: ${htmlContent.length} characters`);
  console.log("===================\n");

  const recipients = parseRecipients(process.env.TO_EMAILS);

  return {
    success: true,
    dryRun: true,
    messageId: "dry-run-" + Date.now(),
    recipients,
    sentAt: new Date().toISOString(),
  };
}

/**
 * Utility function to sleep for a specified duration
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
