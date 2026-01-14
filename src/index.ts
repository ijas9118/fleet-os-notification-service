import createApp from "./app";
import { initConfig } from "./config/init-config";
import { connectConsumer, disconnectConsumer } from "./config/kafka";
import logger from "./config/logger";
import env from "./config/validate-env";
import { KafkaConsumerService } from "./services/kafka-consumer.service";

const app = createApp();
const PORT = env.PORT || 3005;

// Initialize Kafka consumer
const kafkaConsumer = new KafkaConsumerService();

(async () => {
  try {
    await initConfig();

    // Start Kafka connection in background with retry loop
    const connectKafka = async () => {
      let retries = 0;
      while (true) {
        try {
          await connectConsumer();
          await kafkaConsumer.start();
          logger.info("✅ Kafka consumer connected and started");
          break;
        }
        catch (error) {
          retries++;
          logger.warn(`Failed to connect to Kafka (attempt ${retries}), retrying in 5s...`, error);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    };

    // Don't await - let it run in background
    connectKafka();

    app.listen(PORT, () => {
      logger.info(`Notification Server started on port ${PORT}`);
    });
  }
  catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await disconnectConsumer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await disconnectConsumer();
  process.exit(0);
});
