import "dotenv/config";
import pino from "pino";


import app from "./app.ts";
import { verifyMailConnection } from "./modules/auth/config/mail.ts";
import { connectDatabase, prisma } from "./database/prisma-client.ts";


const PORT = process.env.PORT || 3000;
const Logger = pino();

async function startServer() {
  await verifyMailConnection();
  await connectDatabase(prisma, Logger);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});