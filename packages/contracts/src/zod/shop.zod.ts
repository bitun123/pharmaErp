import { z } from "zod";

/**
 * Slug regex:
 * - Lowercase alphanumeric characters
 * - Single hyphens between characters
 * - No leading, trailing, or consecutive hyphens
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** ImageKit file ids are alphanumeric. Mirrors the check in the backend media service. */
export const FILE_ID_REGEX = /^[A-Za-z0-9]{8,64}$/;

const fileIdField = z
  .string()
  .trim()
  .regex(FILE_ID_REGEX, "Logo file ID is not valid.");

/**
 * Optional text for CREATE: empty string and null both mean "not provided".
 */
const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} cannot exceed ${max} characters.`)
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? val : undefined));

/**
 * Optional text for UPDATE: undefined = leave unchanged, "" or null = clear the field.
 */
const clearableText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} cannot exceed ${max} characters.`)
    .nullable()
    .optional()
    .transform((val) => (val === undefined ? undefined : val ? val : null));

/**
 * Zod validation schema for creating a new Shop.
 * Mirrors the Prisma `Shop` model and covers all client/server edge cases:
 * - Trims whitespace
 * - Enforces minimum and maximum name bounds
 * - Formats and validates slug (lowercase, URL-safe)
 * - Sanitizes optional fields (empty string converted to undefined)
 * - Accepts the logo as an uploaded ImageKit file id (the URL is resolved server-side)
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

  // The logo is uploaded first (POST /api/media/upload, folder "shops/logos").
  // Send the returned fileId; the server resolves the URL itself.
  logoFileId: fileIdField.optional().nullable().or(z.literal("")).transform((val) => (val ? val : undefined)),

  address: optionalText("Address", 300),

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

  isActive: z.boolean().default(true).optional(),
});

/**
 * Zod validation schema for updating an existing Shop.
 * Any subset of fields may be sent. For `address` and `logoFileId`, null (or "")
 * clears the value and omitting the key leaves it unchanged.
 */
export const updateShopSchema = z
  .object({
    name: createShopSchema.shape.name.optional(),
    slug: createShopSchema.shape.slug,
    address: clearableText("Address", 300),
    logoFileId: fileIdField
      .nullable()
      .or(z.literal(""))
      .optional()
      .transform((val) => (val === undefined ? undefined : val ? val : null)),
    isActive: z.boolean().optional(),
    // Only used when reassigning the shop to a different existing admin.
    // Not part of create: the admin is created together with the shop.
    adminId: z.string().trim().min(1, "Admin ID cannot be empty.").optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
  });

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
    .enum(["createdAt", "updatedAt", "name", "slug", "shopCode", "isActive"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
 