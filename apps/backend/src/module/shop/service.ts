import crypto from "node:crypto";
import { prisma } from "../auth/config/database.js";
import { hashPassword } from "better-auth/crypto";
import { AppError } from "../../error/app-error.js";
import { sendShopAdminWelcomeEmail } from "../auth/service/email.service.js";
import { createMembershipForUser } from "../auth/service/membership.service.js";
import type {
  CreateShopInput,
  UpdateShopInput,
  ListShopsQuery,
  SetAdminPasswordInput,
} from "@repo/contracts";

/**
 * Converts a shop name into a clean, URL-safe slug.
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Finds an available unique slug by appending incremental numeric suffixes if collisions occur.
 */
export const getAvailableSlug = async (
  baseSlug: string,
  excludeShopId?: string
): Promise<string> => {
  let candidate = baseSlug || "shop";
  let counter = 1;

  while (true) {
    const existing = await prisma.shop.findFirst({
      where: {
        slug: candidate,
        ...(excludeShopId ? { id: { not: excludeShopId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Service to create a new Shop and its Admin user.
 * Flow:
 * 1. Checks/Creates admin user with ADMIN role.
 * 2. If password provided -> hashes and sets up direct login credentials.
 * 3. If password not provided -> creates secure 48h password setup token.
 * 4. Generates unique slug and creates shop.
 * 5. Dispatches welcome/invitation email with login or setup link.
 */
export const createShopService = async (input: CreateShopInput) => {
  const normalizedEmail = input.adminEmail.trim().toLowerCase();
  const adminName = input.adminName.trim();
  const publicWebUrl = (process.env.PUBLIC_WEB_URL || "http://localhost:3000").replace(/\/+$/, "");

  // 1. Check if user with adminEmail already exists
  let adminUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, role: true },
  });

  if (adminUser) {
    // Check if this user already manages a shop (1:1 relation constraint)
    const existingShop = await prisma.shop.findUnique({
      where: { adminId: adminUser.id },
      select: { id: true, name: true },
    });

    if (existingShop) {
      throw new AppError(
        "ADMIN_ALREADY_ASSIGNED",
        `User '${adminUser.name}' (${normalizedEmail}) is already the administrator of '${existingShop.name}'. Each shop must have a distinct admin.`,
        409
      );
    }

    // Elevate role to ADMIN if not already
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: "ADMIN", emailVerified: true },
    });

    // Seeds/re-seeds ADMIN permissions from the role template
    await createMembershipForUser(adminUser.id, "ADMIN");
  } else {
    // Create new admin user
    const newUserId = crypto.randomUUID();
    adminUser = await prisma.user.create({
      data: {
        id: newUserId,
        name: adminName,
        email: normalizedEmail,
        role: "ADMIN",
        emailVerified: true,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await createMembershipForUser(adminUser.id, "ADMIN");
  }

  // 2. Handle Password Setup vs. Direct Password
  let setupUrl: string | undefined = undefined;
  const rawPassword = input.adminPassword?.trim();

  if (rawPassword) {
    // Superadmin provided a password -> hash and store in Account table
    const hashedPassword = await hashPassword(rawPassword);

    const existingAccount = await prisma.account.findFirst({
      where: { userId: adminUser.id, providerId: "credential" },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: adminUser.id,
          providerId: "credential",
          userId: adminUser.id,
          password: hashedPassword,
        },
      });
    }
  } else {
    // Password was NOT provided -> generate secure setup token (48h expiry)
    const setupToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours

    // Invalidate any older pending setup tokens for this email
    await prisma.verification.deleteMany({
      where: { identifier: `set-admin-password:${normalizedEmail}` },
    });

    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: `set-admin-password:${normalizedEmail}`,
        value: setupToken,
        expiresAt,
      },
    });

    setupUrl = `${publicWebUrl}/set-password?token=${setupToken}&email=${encodeURIComponent(normalizedEmail)}`;
  }

  // 3. Resolve slug (either validate provided or auto-generate unique)
  let finalSlug: string;
  if (input.slug) {
    const slugConflict = await prisma.shop.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });

    if (slugConflict) {
      throw new AppError(
        "SLUG_ALREADY_EXISTS",
        `A shop with slug '${input.slug}' already exists. Please choose a different slug.`,
        409
      );
    }
    finalSlug = input.slug;
  } else {
    const base = slugify(input.name);
    finalSlug = await getAvailableSlug(base);
  }

  // 4. Create shop in database
  const shop = await prisma.shop.create({
    data: {
      name: input.name,
      slug: finalSlug,
      logo: input.logo,
      address: input.address,
      adminId: adminUser.id,
      isActive: input.isActive ?? true,
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phoneNumber: true,
          image: true,
        },
      },
    },
  });

  // Link the admin's membership to the new shop
  await createMembershipForUser(adminUser.id, "ADMIN", shop.id);

  // 5. Send welcome email asynchronously
  void sendShopAdminWelcomeEmail({
    email: normalizedEmail,
    name: adminName,
    shopName: shop.name,
    password: rawPassword,
    setupUrl,
  });

  return {
    ...shop,
    adminCredentials: {
      email: normalizedEmail,
      hasDirectLogin: Boolean(rawPassword),
      setupUrl: setupUrl || null,
    },
  };
};

/**
 * Service to set admin password using the setup token sent via email.
 */
export const setAdminPasswordService = async (input: SetAdminPasswordInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const token = input.token.trim();
  const password = input.password.trim();

  // 1. Verify token
  const verification = await prisma.verification.findFirst({
    where: {
      identifier: `set-admin-password:${normalizedEmail}`,
      value: token,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) {
    throw new AppError(
      "INVALID_OR_EXPIRED_TOKEN",
      "The password setup link is invalid or has expired. Please request a new setup link from your Super Administrator.",
      400
    );
  }

  // 2. Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new AppError(
      "USER_NOT_FOUND",
      "Admin user account could not be found.",
      404
    );
  }

  // 3. Hash and store password
  const hashedPassword = await hashPassword(password);

  const existingAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
  }

  // 4. Invalidate used verification token
  await prisma.verification.delete({
    where: { id: verification.id },
  });

  return {
    success: true,
    message: "Password set successfully. You can now log in to the portal.",
  };
};

/**
 * Service to list shops with pagination, multi-field search, status filtering, and sorting.
 */
export const listShopsService = async (query: ListShopsQuery) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  // Build filter criteria
  const where: any = {};

  // Status filter
  if (query.isActive === "true") {
    where.isActive = true;
  } else if (query.isActive === "false") {
    where.isActive = false;
  }

  // Search filter across name, shopCode, and slug
  if (query.search && query.search.trim()) {
    const searchTerm = query.search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { shopCode: { contains: searchTerm, mode: "insensitive" } },
      { slug: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Sorting
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const orderBy = { [sortBy]: sortOrder };

  // Fetch count and records in parallel transaction
  const [total, shops] = await prisma.$transaction([
    prisma.shop.count({ where }),
    prisma.shop.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: shops,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Service to fetch a single shop by its unique ID or Slug.
 */
export const getShopByIdService = async (idOrSlug: string) => {
  if (!idOrSlug || !idOrSlug.trim()) {
    throw new AppError("INVALID_IDENTIFIER", "Shop ID or slug is required.", 400);
  }

  const cleanIdentifier = idOrSlug.trim();

  const shop = await prisma.shop.findFirst({
    where: {
      OR: [{ id: cleanIdentifier }, { slug: cleanIdentifier }],
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phoneNumber: true,
          image: true,
        },
      },
    },
  });

  if (!shop) {
    throw new AppError(
      "SHOP_NOT_FOUND",
      `Shop '${cleanIdentifier}' was not found.`,
      404
    );
  }

  return shop;
};

/**
 * Service to update an existing shop.
 */
export const updateShopService = async (
  shopId: string,
  input: UpdateShopInput
) => {
  if (!shopId || !shopId.trim()) {
    throw new AppError("INVALID_SHOP_ID", "Shop ID is required.", 400);
  }

  // 1. Verify shop exists
  const existingShop = await prisma.shop.findUnique({
    where: { id: shopId.trim() },
  });

  if (!existingShop) {
    throw new AppError(
      "SHOP_NOT_FOUND",
      `Shop with ID '${shopId}' does not exist.`,
      404
    );
  }

  // 2. Validate slug if being updated
  let finalSlug = existingShop.slug;
  if (input.slug && input.slug !== existingShop.slug) {
    const slugConflict = await prisma.shop.findFirst({
      where: {
        slug: input.slug,
        id: { not: existingShop.id },
      },
      select: { id: true },
    });

    if (slugConflict) {
      throw new AppError(
        "SLUG_ALREADY_EXISTS",
        `Slug '${input.slug}' is already in use by another shop.`,
        409
      );
    }
    finalSlug = input.slug;
  }

  // 3. Validate adminId if being updated
  let finalAdminId = existingShop.adminId;
  if (input.adminId && input.adminId !== existingShop.adminId) {
    const newAdmin = await prisma.user.findUnique({
      where: { id: input.adminId },
      select: { id: true, name: true },
    });

    if (!newAdmin) {
      throw new AppError(
        "ADMIN_NOT_FOUND",
        `User with ID '${input.adminId}' does not exist.`,
        404
      );
    }

    const adminConflict = await prisma.shop.findFirst({
      where: {
        adminId: input.adminId,
        id: { not: existingShop.id },
      },
      select: { id: true },
    });

    if (adminConflict) {
      throw new AppError(
        "ADMIN_ALREADY_ASSIGNED",
        `User '${newAdmin.name}' is already assigned as admin to another shop.`,
        409
      );
    }
    finalAdminId = input.adminId;
  }

  // 4. Perform update
  const adminChanged = finalAdminId !== existingShop.adminId;
  const updatedShop = await prisma.shop.update({
    where: { id: existingShop.id },
    data: {
      name: input.name ?? existingShop.name,
      slug: finalSlug,
      logo: input.logo !== undefined ? input.logo : existingShop.logo,
      address: input.address !== undefined ? input.address : existingShop.address,
      adminId: finalAdminId,
      isActive: input.isActive !== undefined ? input.isActive : existingShop.isActive,
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phoneNumber: true,
          image: true,
        },
      },
    },
  });

  // Move the shop link and ADMIN role from the old admin to the new one
  if (adminChanged) {
    await createMembershipForUser(finalAdminId, "ADMIN", updatedShop.id);
    await prisma.membership.updateMany({
      where: { userId: existingShop.adminId, shopId: updatedShop.id },
      data: { shopId: null },
    });
    await prisma.user.update({
      where: { id: finalAdminId },
      data: { role: "ADMIN" },
    });
  }

  return updatedShop;
};

/**
 * Service to delete a shop.
 */
export const deleteShopService = async (shopId: string) => {
  if (!shopId || !shopId.trim()) {
    throw new AppError("INVALID_SHOP_ID", "Shop ID is required.", 400);
  }

  const existingShop = await prisma.shop.findUnique({
    where: { id: shopId.trim() },
    select: { id: true, name: true },
  });

  if (!existingShop) {
    throw new AppError(
      "SHOP_NOT_FOUND",
      `Shop with ID '${shopId}' was not found.`,
      404
    );
  }

  await prisma.shop.delete({
    where: { id: existingShop.id },
  });

  return {
    success: true,
    message: `Shop '${existingShop.name}' has been deleted successfully.`,
    id: existingShop.id,
  };
};
