// One-off / cron: removes ImageKit uploads that were never attached to a shop.
// Uploads are tagged "pending" and lose the tag once a shop uses them, so anything
// still tagged after the cutoff is an orphan (e.g. a shop create that failed).
// Run from apps/backend:
//   npx tsx scripts/cleanup-pending-uploads.ts                  (dry run, 24h cutoff)
//   npx tsx scripts/cleanup-pending-uploads.ts --apply          (deletes)
//   npx tsx scripts/cleanup-pending-uploads.ts --hours=48 --apply
import "dotenv/config";
import { prisma } from "../src/module/auth/config/database.js";
import { listStalePendingUploads, safeDeleteFile } from "../src/services/imagekit.service.js";

const apply = process.argv.includes("--apply");
const hoursArg = process.argv.find((a) => a.startsWith("--hours="));
const hours = hoursArg ? Number(hoursArg.split("=")[1]) : 24;

if (!Number.isFinite(hours) || hours < 1) {
  console.error("--hours must be a number >= 1");
  process.exit(1);
}

const stale = await listStalePendingUploads(hours * 60 * 60 * 1000);
let deleted = 0;
let skipped = 0;

for (const file of stale) {
  // Safety net: never delete a file that a shop still references.
  const inUse = await prisma.shop.findFirst({
    where: { logoFileId: file.fileId },
    select: { id: true },
  });
  if (inUse) {
    skipped++;
    console.log(`SKIP (in use by shop ${inUse.id}): ${file.filePath}`);
    continue;
  }

  console.log(`${apply ? "DELETE" : "would delete"}: ${file.filePath} (${file.createdAt})`);
  if (apply) {
    await safeDeleteFile(file.fileId);
    deleted++;
  }
}

console.log(
  `\n${stale.length} stale pending upload(s) older than ${hours}h; ` +
    `${apply ? `${deleted} deleted` : "dry run, nothing deleted"}; ${skipped} skipped.`,
);
await prisma.$disconnect();
