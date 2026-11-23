import { connectDatabase } from './src/module/auth/config/database.js';
import {verifyMailConnection} from "./src/module/auth/config/mail.js"
import "dotenv/config";
import app from "./src/app.js"
import { logger } from './src/config/logger.js';


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    await verifyMailConnection()
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

  } catch (error) {
   logger.error({ err: error }, "Server startup failed:");
    process.exit(1);
  }
};

startServer();