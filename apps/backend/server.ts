import { connectDatabase } from './src/module/auth/config/database.js';
import "dotenv/config";
import app from "./src/app.js"


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();