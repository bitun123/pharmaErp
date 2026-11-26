import { createShopSchema, zodResolver, type CreateShopInput, type CreateShopResponse } from "@repo/contracts";
import { ApiError } from "@/lib/client";
import { getErrorFriendlyMessage } from "@/lib/errorFriendlyMessage";

// Folder on the backend (ImageKit) where shop logos are stored.
export const SHOP_LOGO_FOLDER = "shops/logos";

/** Everything the "Register New Shop" form holds. Text boxes are always strings (possibly empty). */
export type RegisterShopFormValues = {
  name: string;
  slug: string;
  address: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  isActive: boolean;
  /** Id returned by the upload API once the picked logo is uploaded. Empty when there is no logo. */
  logoFileId: string;
};

export const REGISTER_SHOP_DEFAULTS: RegisterShopFormValues = {
  name: "",
  slug: "",
  address: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  isActive: true,
  logoFileId: "",
};

/** Hardest limits straight from the shared schema, used for character counters and maxLength. */
export const REGISTER_SHOP_LIMITS = { name: 100, slug: 60, address: 300, adminName: 100, password: 128 } as const;

type FieldErrors = Record<string, { type: string; message: string }>;

/** True when the user has typed or chosen anything (used to ask before throwing the form away). */
export function isRegisterShopFormFilled(values: RegisterShopFormValues): boolean {
  return (
    values.name.trim() !== "" ||
    values.slug.trim() !== "" ||
    values.address.trim() !== "" ||
    values.adminName.trim() !== "" ||
    values.adminEmail.trim() !== "" ||
    values.adminPassword !== "" ||
    values.logoFileId !== "" ||
    values.isActive !== REGISTER_SHOP_DEFAULTS.isActive
  );
}

/** An empty text box means "not provided". Everything else is passed through as typed. */
function emptyTextAsUndefined(values: RegisterShopFormValues) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === "string" && value.trim() === "" ? undefined : value]),
  );
}

/**
 * Validation with the same rules as the backend (the shared createShopSchema).
 * An empty text box means "not provided", so an empty slug or password is fine,
 * while an empty name or email gets the schema's "... is required" message.
 */
export async function validateRegisterShop(values: RegisterShopFormValues) {
  const result = await zodResolver(createShopSchema)(emptyTextAsUndefined(values));
  const errors: FieldErrors = { ...result.errors };

  return errors;
}

/** The resolver react-hook-form uses for this form. */
export const registerShopResolver = async (values: RegisterShopFormValues) => {
  const errors = await validateRegisterShop(values);
  return Object.keys(errors).length > 0 ? { values: {}, errors } : { values, errors: {} };
};

/**
 * The exact request body for POST /api/shop. It goes through the same shared schema as the
 * validation, so what is sent is trimmed, lowercased where needed, and free of empty strings.
 * Call it only for values that already passed validation.
 */
export function toCreateShopInput(values: RegisterShopFormValues): CreateShopInput {
  return createShopSchema.parse(emptyTextAsUndefined(values));
}

export type RegisterShopField = "name" | "slug" | "address" | "adminName" | "adminEmail" | "adminPassword" | "logoFileId" | "isActive";

const FORM_FIELDS: readonly RegisterShopField[] = ["name", "slug", "address", "adminName", "adminEmail", "adminPassword", "logoFileId", "isActive"];

/** What to show after the backend refused to register the shop. */
export type CreateShopFailure = {
  /** Messages to put next to specific fields. */
  fieldErrors: Partial<Record<RegisterShopField, string>>;
  /** A message for the top of the form (when no single field is to blame), or null. */
  formError: string | null;
  /** The uploaded logo can no longer be used: clear it so the user picks it again. */
  clearLogo: boolean;
  /** The user has to sign in again. */
  signIn: boolean;
};

const LOGO_UNUSABLE = "The logo could not be used. Please choose it again.";

/** Backend error code -> where the message goes. */
const CODE_RULES: Record<string, { field?: RegisterShopField; message: string; clearLogo?: boolean }> = {
  ADMIN_ALREADY_ASSIGNED: { field: "adminEmail", message: "This person already manages another shop. Use a different email." },
  ADMIN_IS_SUPER_ADMIN: { field: "adminEmail", message: "This email belongs to a Super Administrator and cannot manage a shop." },
  EMAIL_ALREADY_EXISTS: { field: "adminEmail", message: "This email is already in use. Please try again or use another email." },
  SLUG_ALREADY_EXISTS: { field: "slug", message: "This slug is already taken. Choose another one or leave it empty." },
  INVALID_SLUG: { field: "slug", message: "Slug must contain letters or numbers." },
  LOGO_ALREADY_IN_USE: { message: LOGO_UNUSABLE, clearLogo: true },
  INVALID_LOGO_FOLDER: { message: LOGO_UNUSABLE, clearLogo: true },
  INVALID_FILE_ID: { message: LOGO_UNUSABLE, clearLogo: true },
  FILE_NOT_FOUND: { message: LOGO_UNUSABLE, clearLogo: true },
};

const NO_FAILURE_DETAILS = { fieldErrors: {}, formError: null, clearLogo: false, signIn: false } as const;

/** Turns whatever went wrong while registering into messages for the right places. */
export function mapCreateShopError(error: unknown): CreateShopFailure {
  const failure: CreateShopFailure = { ...NO_FAILURE_DETAILS, fieldErrors: {} };

  if (!(error instanceof ApiError)) {
    failure.formError = getErrorFriendlyMessage(error);
    return failure;
  }

  if (error.status === 401) {
    failure.formError = "Your session expired. Please sign in again.";
    failure.signIn = true;
    return failure;
  }
  if (error.status === 403) {
    failure.formError = "You don't have permission to register shops.";
    return failure;
  }

  if (error.code === "VALIDATION_ERROR" && Array.isArray(error.details)) {
    for (const item of error.details as { field?: unknown; message?: unknown }[]) {
      const field = FORM_FIELDS.find((name) => name === item?.field);
      if (field && typeof item.message === "string" && !failure.fieldErrors[field]) failure.fieldErrors[field] = item.message;
    }
    if (Object.keys(failure.fieldErrors).length === 0) failure.formError = error.message || "Please check the form and try again.";
    return failure;
  }

  const rule = error.code ? CODE_RULES[error.code] : undefined;
  if (rule) {
    if (rule.field) failure.fieldErrors[rule.field] = rule.message;
    else failure.formError = rule.message;
    failure.clearLogo = Boolean(rule.clearLogo);
    return failure;
  }

  failure.formError = getErrorFriendlyMessage(error);
  return failure;
}

/** The outcome of one attempt to register a shop. It never throws: failures come back as messages to show. */
export type RegisterShopResult =
  | { ok: true; response: CreateShopResponse }
  | { ok: false; failure: CreateShopFailure };

/** Builds the request from the validated form and sends it with `create` (the real API call in the app). */
export async function registerShop(
  values: RegisterShopFormValues,
  create: (input: CreateShopInput) => Promise<CreateShopResponse>,
): Promise<RegisterShopResult> {
  try {
    return { ok: true, response: await create(toCreateShopInput(values)) };
  } catch (error) {
    return { ok: false, failure: mapCreateShopError(error) };
  }
}

/** The success message: what happens next for the admin. The setup link itself is never shown. */
export function registeredMessage(response: CreateShopResponse): { title: string; description: string } {
  const { name, adminCredentials } = response.data;
  const email = adminCredentials?.email ?? "The admin";
  return {
    title: `${name} registered`,
    description: adminCredentials?.setupUrl
      ? `We emailed ${email} a link to set their password.`
      : `${email} can sign in right away.`,
  };
}
