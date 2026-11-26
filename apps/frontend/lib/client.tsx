// Always same-origin: next.config.ts rewrites /api/* to the backend, so requests carry this site's session cookie.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    /** The backend's per-field validation errors ([{ field, message }]), when it sent any. */
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = RequestInit & {
  params?: Record<string, string>;
};

async function request<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  const url = new URL(endpoint, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  // A file upload must NOT set Content-Type itself: the browser adds the multipart boundary.
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...fetchOptions.headers,
      },
      credentials: "include",
    });
  } catch (error) {
    // A request we cancelled ourselves (e.g. the user picked another file) is not a network failure.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request cancelled.", 0, "ABORTED");
    }
    throw new ApiError("Unable to reach the server.", 0, "NETWORK_ERROR");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? response.statusText ?? "API request failed",
      response.status,
      data?.code,
      data?.errors,
    );
  }

  return data as T;
}

export const api = {
    get: <T,>(url: string, options?: ApiOptions) =>
      request<T>(url, { ...options, method: "GET" }),

  post: <T,>(url: string, data?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T,>(url: string, data?: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  patch: <T,>(url: string, data?: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: <T,>(url: string) =>
    request<T>(url, { method: "DELETE" }),

  /** Sends a file (multipart). Pass a signal to be able to cancel it. */
  upload: <T,>(url: string, body: FormData, options?: { signal?: AbortSignal }) =>
    request<T>(url, { method: "POST", body, signal: options?.signal }),
};