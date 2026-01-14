import type { Transporter } from "nodemailer";

import nodemailer from "nodemailer";

import logger from "./logger";
import env from "./validate-env";

/**
 * Nodemailer transporter instance
 * Configured for Gmail SMTP with app password
 */
let transporter: Transporter | null = null;

/**
 * Initialize email transporter
 */

export function initializeEmailTransporter(): void {
  try {
    // Log SMTP configuration for debugging (without password)
    logger.info("Initializing email transporter with config:", {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      passwordLength: env.SMTP_PASSWORD?.length || 0,
    });

    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      tls: {
        // Do not force SSLv3, let valid TLS version be negotiated
        rejectUnauthorized: false, // For development verification
      },
    });

    logger.info("✅ Email transporter initialized successfully");
  }
  catch (error) {
    logger.error("❌ Failed to initialize email transporter", error);
    throw error;
  }
}

/**
 * Get email transporter instance
 * Throws error if not initialized
 */
export function getEmailTransporter(): Transporter {
  if (!transporter) {
    throw new Error("Email transporter not initialized. Call initializeEmailTransporter() first.");
  }
  return transporter;
}

/**
 * Verify email transporter connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  if (!transporter) {
    logger.warn("Email transporter not initialized");
    return false;
  }

  try {
    logger.info("Verifying email server connection...");
    await transporter.verify();
    logger.info("✅ Email server connection verified");
    return true;
  }
  catch (error: any) {
    logger.error("❌ Email server connection failed", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
      // Serialize entire error for debugging
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    return false;
  }
}
