/**
 * Mock SMTP Adapter - Simulates email sending without actual delivery
 * Use for testing pipeline and newsletter compilation
 */

/**
 * Mock implementation of sendNewsletter
 * @param {string} htmlContent - Compiled newsletter HTML
 * @returns {Promise<Object>} Mock send status
 */
export default async function mockSendNewsletter(htmlContent) {
  if (!htmlContent || typeof htmlContent !== "string") {
    throw new Error("htmlContent must be a non-empty string");
  }

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 20));

  // Return success response (must match SMTP adapter structure)
  return {
    success: true,
    messageId: `<mock-${Date.now()}@test.local>`,
    recipients: ["test@example.com"],
    sentAt: new Date().toISOString(),
  };
}
