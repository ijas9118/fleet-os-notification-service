import type { Consumer } from "kafkajs";

import { Kafka, logLevel } from "kafkajs";

import logger from "./logger";
import env from "./validate-env";

/**
 * Kafka client instance configured for FleetOS Notification Service
 */
const kafka = new Kafka({
  clientId: "fleet-os-notification-service",
  brokers: [env.KAFKA_BROKER || "kafka.infrastructure.svc.cluster.local:9092"],
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    multiplier: 2,
  },
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

/**
 * Kafka consumer instance for consuming events
 * Part of notification-service-group consumer group
 */
const consumer: Consumer = kafka.consumer({
  groupId: env.KAFKA_GROUP_ID || "notification-service-group",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  retry: {
    retries: 5,
  },
});

let isConnected = false;

/**
 * Connect the Kafka consumer
 * Should be called during application startup
 */
export async function connectConsumer(): Promise<void> {
  if (!isConnected) {
    try {
      await consumer.connect();
      isConnected = true;
      logger.info("✅ Kafka consumer connected successfully");
    }
    catch (error) {
      logger.error("❌ Failed to connect Kafka consumer", error);
      throw error;
    }
  }
}

/**
 * Disconnect the Kafka consumer
 * Should be called during graceful shutdown
 */
export async function disconnectConsumer(): Promise<void> {
  if (isConnected) {
    try {
      await consumer.disconnect();
      isConnected = false;
      logger.info("Kafka consumer disconnected");
    }
    catch (error) {
      logger.error("Error disconnecting Kafka consumer", error);
    }
  }
}

/**
 * Check if consumer is connected
 */
export function isConsumerConnected(): boolean {
  return isConnected;
}

export { consumer, kafka };
