import createApp from "./app";
import { initConfig } from "./config/init-config";
import logger from "./config/logger";
import env from "./config/validate-env";

const app = createApp();

const PORT = env.PORT || 3005;

(async () => {
  try {
    await initConfig();
    app.listen(PORT, () => {
      logger.info(`Notification Server started on port ${PORT}`);
    });
  }
  catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
})();
