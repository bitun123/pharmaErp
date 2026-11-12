import type { PlatformUserKind, PrismaClient, UserStatus } from "@prisma/client";

export interface PlatformUserCredentialState {
  id: string;
  email: string;
  fullName: string;
  kind: PlatformUserKind;
  status: UserStatus;
  failedLoginCount: number;
  lockedUntil: Date | null;
}

// The only code in this module that talks to Prisma. Platform tables are not tenant-owned,
// so there is no tenant scope here (DATABASE.md 4.1).
export class PlatformAuthRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  findByEmail(email: string): Promise<PlatformUserCredentialState | null> {
    return this.prisma.platformUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        kind: true,
        status: true,
        failedLoginCount: true,
        lockedUntil: true,
      },
    });
  }

  // One atomic statement so concurrent wrong passwords cannot lose an increment; the lock
  // is set in the same statement once the threshold is reached (PRD NFR-SEC-03).
  async recordFailedLogin(userId: string, maxAttempts: number, lockedUntil: Date): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE platform_users
      SET failed_login_count = failed_login_count + 1,
          locked_until = CASE WHEN failed_login_count + 1 >= ${maxAttempts}
                              THEN ${lockedUntil} ELSE locked_until END,
          updated_at = now()
      WHERE id = ${userId}::uuid`;
  }

  // Starts a fresh failure window once a lock has run out, so a single wrong password after
  // the lock expires does not immediately lock the account again.
  async clearExpiredLock(userId: string, now: Date): Promise<void> {
    await this.prisma.platformUser.updateMany({
      where: { id: userId, lockedUntil: { lte: now } },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  async recordSuccessfulLogin(userId: string, now: Date): Promise<void> {
    await this.prisma.platformUser.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now },
    });
  }
}
