import { initializeEmailTransporter, verifyEmailConnection } from "./email";
import logger from "./logger";
import connectMongo from "./mongo.connect";

export async function initConfig() {
  logger.info("Initializing application configuration...");
  await connectMongo();

  // Initialize email transporter
  initializeEmailTransporter();
  await verifyEmailConnection();
}
