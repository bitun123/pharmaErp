import { z } from "zod";

/**
 * Slug regex:
 * - Lowercase alphanumeric characters
 * - Single hyphens between characters
 * - No leading, trailing, or consecutive hyphens
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Zod validation schema for creating a new Shop.
 * Mirrors the Prisma `Shop` model and covers all client/server edge cases:
 * - Trims whitespace
 * - Enforces minimum and maximum name bounds
 * - Formats and validates slug (lowercase, URL-safe)
 * - Sanitizes optional fields (empty string converted to undefined)
 * - Validates logo URL format
 */
export const createShopSchema = z.object({
  name: z
    .string({
      error: "Shop name is required.",
    })
    .trim()
    .min(2, "Shop name must be at least 2 characters long.")
    .max(100, "Shop name cannot exceed 100 characters."),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters long.")
    .max(60, "Slug cannot exceed 60 characters.")
    .regex(
      SLUG_REGEX,
      "Slug must contain only lowercase letters, numbers, and single hyphens (e.g. 'central-pharmacy-branch-1')."
    )
    .optional(),

  logo: z
    .string()
    .trim()
    .url("Logo must be a valid URL.")
    .max(500, "Logo URL cannot exceed 500 characters.")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? val : undefined)),

  address: z
    .string()
    .trim()
    .max(300, "Address cannot exceed 300 characters.")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? val : undefined)),

  adminName: z
    .string({
      error: "Admin name is required.",
    })
    .trim()
    .min(2, "Admin name must be at least 2 characters long.")
    .max(100, "Admin name cannot exceed 100 characters."),

  adminEmail: z
    .string({
      error: "Admin email is required.",
    })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address."),

  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password cannot exceed 128 characters.")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? val : undefined)),

  adminId: z
    .string()
    .trim()
    .min(1, "Admin ID cannot be empty.")
    .optional(),

  isActive: z.boolean().default(true).optional(),
});

/**
 * Zod validation schema for updating an existing Shop.
 * Allows updating any subset of the shop fields.
 */
export const updateShopSchema = createShopSchema.partial();

/**
 * Zod validation schema for an admin setting their password using the invitation/setup link.
 */
export const setAdminPasswordSchema = z.object({
  email: z
    .string({
      error: "Email is required.",
    })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address."),
  token: z
    .string({
      error: "Token is required.",
    })
    .trim()
    .min(1, "Token cannot be empty."),
  password: z
    .string({
      error: "Password is required.",
    })
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password cannot exceed 128 characters."),
});

/**
 * Zod validation schema for listing shops with search, filter, pagination, and sorting.
 */
export const listShopsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  isActive: z.enum(["true", "false", "all"]).optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "name", "shopCode"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
