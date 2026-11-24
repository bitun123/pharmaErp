// Always same-origin: next.config.ts rewrites /api/* to the backend, so requests carry this site's session cookie.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
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

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      credentials: "include",
    });
  } catch {
    throw new ApiError("Unable to reach the server.", 0, "NETWORK_ERROR");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? response.statusText ?? "API request failed",
      response.status,
      data?.code,
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
};