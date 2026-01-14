import type { SendMailOptions } from "nodemailer";

import { getEmailTransporter } from "@/config/email";
import logger from "@/config/logger";
import env from "@/config/validate-env";
import { generateOtpEmailTemplate, generateOtpEmailText } from "@/templates/otp-email";

/**
 * Email Service
 * Handles sending emails via nodemailer
 */
export class EmailService {
  /**
   * Send OTP email to user
   * @param to - Recipient email address
   * @param otp - 6-digit OTP code
   * @param type - Registration type (user or tenant)
   * @param expiresAt - ISO 8601 expiry timestamp
   */
  async sendOtpEmail(
    to: string,
    otp: string,
    type: "user" | "tenant",
    expiresAt: string,
  ): Promise<void> {
    try {
      // Calculate minutes until expiry
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      const minutesUntilExpiry = Math.max(
        1,
        Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60)),
      );

      const subject = type === "user"
        ? "FleetOS - Your Registration OTP"
        : "FleetOS - Organization Registration OTP";

      const html = generateOtpEmailTemplate(otp, type, minutesUntilExpiry);
      const text = generateOtpEmailText(otp, type, minutesUntilExpiry);

      const mailOptions: SendMailOptions = {
        from: env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
      };

      const transporter = getEmailTransporter();
      const info = await transporter.sendMail(mailOptions);

      logger.info("✅ OTP email sent successfully", {
        to,
        type,
        messageId: info.messageId,
      });
    }
    catch (error: any) {
      logger.error("❌ Failed to send OTP email", {
        to,
        type,
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"), // First 3 lines of stack
      });
      throw error; // Re-throw to trigger retry logic in consumer
    }
  }

  /**
   * Send email with retry logic
   * @param to - Recipient email
   * @param otp - OTP code
   * @param type - Registration type
   * @param expiresAt - Expiry timestamp
   * @param maxRetries - Maximum retry attempts (default: 3)
   */
  async sendOtpEmailWithRetry(
    to: string,
    otp: string,
    type: "user" | "tenant",
    expiresAt: string,
    maxRetries: number = 3,
  ): Promise<void> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.sendOtpEmail(to, otp, type, expiresAt);
        return; // Success, exit
      }
      catch (error) {
        lastError = error;
        logger.warn(`Email send attempt ${attempt}/${maxRetries} failed`, {
          to,
          error,
        });

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = 2 ** (attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    logger.error(`Failed to send email after ${maxRetries} attempts`, {
      to,
      error: lastError,
    });
    throw lastError;
  }
}
