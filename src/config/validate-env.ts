import type { ZodError } from "zod";

import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3005),
  SERVICE_NAME: z.string(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  DATABASE_URL: z.string(),
  // Kafka Configuration
  KAFKA_BROKER: z.string().default("kafka.infrastructure.svc.cluster.local:9092"),
  KAFKA_GROUP_ID: z.string().default("notification-service-group"),
  // Email Configuration (Gmail with App Password)
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  // Fix: z.coerce.boolean() converts "false" to true. We need manual transform.
  SMTP_SECURE: z.string().default("false").transform(val => val === "true"), // false for port 587, true for 465
  SMTP_USER: z.string(), // Gmail address
  SMTP_PASSWORD: z.string(), // Gmail app password
  EMAIL_FROM: z.string(),
});

export type env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line import/no-mutable-exports
let env: env;

try {
  // eslint-disable-next-line node/no-process-env
  env = EnvSchema.parse(process.env);
}
catch (e) {
  const error = e as ZodError;
  console.error("❌ Invalid env");
  console.error(error.flatten().fieldErrors);
  process.exit(1);
}

export default env;
