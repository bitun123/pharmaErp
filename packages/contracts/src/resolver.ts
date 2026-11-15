import type { ZodTypeAny } from "zod";

/**
 * Lightweight, zero-dependency Zod resolver compatible with React Hook Form.
 */
export function zodResolver<T extends ZodTypeAny>(schema: T) {
  return async (values: unknown) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field && !errors[String(field)]) {
        errors[String(field)] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }
    return { values: {}, errors };
  };
}
