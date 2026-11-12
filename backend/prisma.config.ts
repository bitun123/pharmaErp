import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

// The shared .env lives at the repository root, where the Prisma CLI does not look.
loadDotenv({ path: resolve(import.meta.dirname, "../.env"), quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
});
