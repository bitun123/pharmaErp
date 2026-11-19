// One-off: seeds Membership.permissions from each role's template and links
// ADMIN memberships to their shop. Run from apps/backend:
//   npx tsx scripts/backfill-permissions.ts          (dry run)
//   npx tsx scripts/backfill-permissions.ts --apply  (writes)
import "dotenv/config";
import { prisma } from "../src/module/auth/config/database.js";
import { buildPermissions, isRoleKey } from "../src/config/permissions.js";
import { normalizePermissions } from "../src/module/auth/service/membership.service.js";

const apply = process.argv.includes("--apply");

const memberships = await prisma.membership.findMany();
let changed = 0;

for (const m of memberships) {
  if (!isRoleKey(m.role)) continue;
  const data: { permissions?: Record<string, true>; shopId?: string } = {};

  // Only fill rows with no usable permissions; never overwrite customised ones.
  if (Object.keys(normalizePermissions(m.permissions)).length === 0) {
    const template = buildPermissions(m.role);
    if (Object.keys(template).length > 0) data.permissions = template;
  }

  if (m.role === "ADMIN" && !m.shopId) {
    const shop = await prisma.shop.findUnique({
      where: { adminId: m.userId },
      select: { id: true },
    });
    if (shop) data.shopId = shop.id;
  }

  if (Object.keys(data).length === 0) continue;
  changed++;
  console.log(`${apply ? "UPDATE" : "WOULD UPDATE"} membership ${m.id}`, data);
  if (apply) await prisma.membership.update({ where: { id: m.id }, data });
}

console.log(`${changed} of ${memberships.length} memberships ${apply ? "updated" : "need updating"}.`);
await prisma.$disconnect();
