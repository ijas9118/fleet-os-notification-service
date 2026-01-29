import { consumer } from "@/config/kafka";
import logger from "@/config/logger";

import { OtpEventHandler } from "./event-handlers/otp-handler";

/**
 * Kafka Consumer Service
 * Subscribes to events and routes to appropriate handlers
 */
export class KafkaConsumerService {
  private otpHandler: OtpEventHandler;
  private isRunning: boolean = false;

  constructor() {
    this.otpHandler = new OtpEventHandler();
  }

  /**
   * Start consuming messages from Kafka
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Kafka consumer already running");
      return;
    }

    try {
      // Consumer is already connected via connectConsumer() in index.ts
      // No need to connect again here

      const topic = "auth-events";

      // Ensure topic exists before subscribing
      await this.ensureTopicExists(topic);

      await consumer.subscribe({
        topic,
        fromBeginning: false,
      });

      logger.info(`✅ Subscribed to topic: ${topic}`);

      await consumer.run({
        eachMessage: async (payload) => {
          const { topic, partition, message } = payload;

          logger.debug("Received message", {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
          });

          // Route messages based on event-type header
          const eventType = message.headers?.["event-type"]?.toString();

          if (eventType === "auth.otp.generated") {
            await this.otpHandler.handle(payload);
          }
        },
      });

      this.isRunning = true;
      logger.info("🚀 Kafka consumer service started");
    }
    catch (error) {
      logger.error("❌ Failed to start Kafka consumer", error);
      throw error;
    }
  }

  /**
   * Ensure topic exists, create if it doesn't
   * Uses Kafka admin client to check and create topic
   */
  private async ensureTopicExists(topic: string): Promise<void> {
    const { kafka } = await import("@/config/kafka");
    const admin = kafka.admin();

    try {
      await admin.connect();
      logger.debug("Connected to Kafka admin client");

      // List existing topics
      const topics = await admin.listTopics();

      if (topics.includes(topic)) {
        logger.info(`Topic '${topic}' already exists`);
      }
      else {
        logger.info(`Topic '${topic}' does not exist, creating...`);

        await admin.createTopics({
          topics: [
            {
              topic,
              numPartitions: 3,
              replicationFactor: 1,
            },
          ],
        });

        logger.info(`✅ Topic '${topic}' created successfully`);
      }
    }
    catch (error: any) {
      // If topic already exists (race condition), ignore the error
      if (error.type === "TOPIC_ALREADY_EXISTS") {
        logger.info(`Topic '${topic}' already exists`);
      }
      else {
        logger.warn(`Failed to ensure topic exists: ${error.message}`);
        // Don't throw - let subscription attempt proceed and fail if needed
      }
    }
    finally {
      await admin.disconnect();
      logger.debug("Disconnected from Kafka admin client");
    }
  }

  /**
   * Check if consumer is running
   */
  isConsumerRunning(): boolean {
    return this.isRunning;
  }
}
