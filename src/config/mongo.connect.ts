import mongoose from "mongoose";

import logger from "./logger";
import env from "./validate-env";

async function connectMongo() {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.DATABASE_URL, { minPoolSize: 1, maxPoolSize: 10 });
    logger.info("✅ Connected to MongoDB", env.SERVICE_NAME);
  }
  catch (error) {
    logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

export default connectMongo;
