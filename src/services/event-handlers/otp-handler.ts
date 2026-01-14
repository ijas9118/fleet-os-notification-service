import type { EachMessagePayload } from "kafkajs";

import logger from "@/config/logger";
import { EmailService } from "@/services/email.service";

/**
 * Domain Event structure (matches auth service)
 */
interface DomainEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  payload: T;
}

/**
 * OTP Generated Event Payload
 */
interface OtpGeneratedPayload {
  email: string;
  otp: string;
  type: "user" | "tenant";
  expiresAt: string;
  purpose: "registration";
}

/**
 * OTP Event Handler
 * Processes otp.generated events and sends emails
 */
export class OtpEventHandler {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Handle OTP generated event
   * @param message - Kafka message payload
   */
  async handle(message: EachMessagePayload): Promise<void> {
    try {
      const value = message.message.value?.toString();
      if (!value) {
        logger.warn("Received empty message", { topic: message.topic });
        return;
      }

      // Parse event
      const event: DomainEvent<OtpGeneratedPayload> = JSON.parse(value);

      logger.info("📨 Processing OTP event", {
        eventId: event.eventId,
        eventType: event.eventType,
        email: event.payload.email,
        type: event.payload.type,
      });

      // Validate event type
      if (event.eventType !== "otp.generated") {
        logger.warn("Unexpected event type", { eventType: event.eventType });
        return;
      }

      // Validate payload
      this.validatePayload(event.payload);

      // Send email with retry
      await this.emailService.sendOtpEmailWithRetry(
        event.payload.email,
        event.payload.otp,
        event.payload.type,
        event.payload.expiresAt,
        3, // 3 retry attempts
      );

      logger.info("✅ OTP event processed successfully", {
        eventId: event.eventId,
        email: event.payload.email,
      });
    }
    catch (error) {
      logger.error("❌ Failed to process OTP event", {
        topic: message.topic,
        partition: message.partition,
        offset: message.message.offset,
        error,
      });
      // Don't throw - let Kafka commit the offset to avoid infinite retries
      // In production, send to dead letter queue for manual review
    }
  }

  /**
   * Validate event payload
   */
  private validatePayload(payload: OtpGeneratedPayload): void {
    if (!payload.email || !payload.otp || !payload.type || !payload.expiresAt) {
      throw new Error("Invalid payload: missing required fields");
    }

    if (!["user", "tenant"].includes(payload.type)) {
      throw new Error(`Invalid type: ${payload.type}`);
    }

    // Check if OTP is expired
    const expiryDate = new Date(payload.expiresAt);
    if (expiryDate < new Date()) {
      logger.warn("OTP already expired", {
        email: payload.email,
        expiresAt: payload.expiresAt,
      });
      // Still send the email, user might have slow connection
    }
  }
}
