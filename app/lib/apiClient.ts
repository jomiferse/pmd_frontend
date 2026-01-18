import { readJson } from "./api";
import { API_BASE_URL } from "./env";
import type { SettingsEntitlements, SettingsPatch, SettingsResponse } from "./settings";

type ApiResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
  status: number;
};

type QueryParams = Record<string, string | number | undefined | null>;

type ApiClientOptions = {
  params?: QueryParams;
  headers?: HeadersInit;
  cache?: RequestCache;
  retry?: RetryOptions;
};

type SettingsUpdateResult = ApiResult<SettingsResponse> & {
  fieldErrors?: Record<string, string>;
};

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

const DEFAULT_RETRY: Required<RetryOptions> = {
  retries: 2,
  baseDelayMs: 300,
  maxDelayMs: 2000
};

function buildQuery(params?: QueryParams) {
  if (!params) {
    return "";
  }
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) {
    return "";
  }
  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return `?${query}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(response: Response | null, attempt: number, options: Required<RetryOptions>) {
  const retryAfter = response?.headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, options.maxDelayMs);
    }
    const date = new Date(retryAfter);
    if (!Number.isNaN(date.getTime())) {
      const delta = date.getTime() - Date.now();
      if (delta > 0) {
        return Math.min(delta, options.maxDelayMs);
      }
    }
  }
  const base = Math.min(options.baseDelayMs * 2 ** attempt, options.maxDelayMs);
  const jitter = Math.floor(base * 0.2 * Math.random());
  return base + jitter;
}

export async function fetchWithSession(
  input: RequestInfo,
  init: RequestInit = {},
  retry: RetryOptions = {}
) {
  const options = { ...DEFAULT_RETRY, ...retry };
  const method = (init.method || "GET").toUpperCase();
  const allowRetry = method === "GET";
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(input, {
        ...init,
        credentials: "include",
        cache: init.cache ?? "no-store"
      });
      if (
        allowRetry &&
        attempt < options.retries &&
        (response.status === 429 || response.status >= 500)
      ) {
        await sleep(retryDelayMs(response, attempt, options));
        attempt += 1;
        continue;
      }
      return response;
    } catch (error) {
      if (allowRetry && attempt < options.retries) {
        await sleep(retryDelayMs(null, attempt, options));
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResult<T>> {
  const payload = await readJson<T | { detail?: string }>(response);
  const detail =
    payload && typeof payload === "object" && "detail" in payload
      ? (payload as { detail?: string }).detail
      : null;
  if (!response.ok) {
    return {
      ok: false,
      data: null,
      error: detail || "Request failed",
      status: response.status
    };
  }
  return { ok: true, data: payload as T, error: null, status: response.status };
}

export const apiClient = {
  async get<T>(path: string, options: ApiClientOptions = {}): Promise<ApiResult<T>> {
    const url = `${API_BASE_URL}${path}${buildQuery(options.params)}`;
    try {
      const response = await fetchWithSession(
        url,
        {
          method: "GET",
          headers: options.headers,
          cache: options.cache
        },
        options.retry
      );
      return await handleResponse<T>(response);
    } catch (error) {
      return { ok: false, data: null, error: "API unreachable", status: 0 };
    }
  },
  async post<T, B>(
    path: string,
    body: B,
    options: Omit<ApiClientOptions, "params"> = {}
  ): Promise<ApiResult<T>> {
    const url = `${API_BASE_URL}${path}`;
    try {
      const response = await fetchWithSession(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        cache: options.cache,
        body: JSON.stringify(body)
      });
      return await handleResponse<T>(response);
    } catch (error) {
      return { ok: false, data: null, error: "API unreachable", status: 0 };
    }
  },
  async getSettings(): Promise<ApiResult<SettingsResponse>> {
    return apiClient.get<SettingsResponse>("/settings/me");
  },
  async getEntitlements(): Promise<ApiResult<SettingsEntitlements>> {
    return apiClient.get<SettingsEntitlements>("/entitlements/me");
  },
  async updateSettings(payload: SettingsPatch): Promise<SettingsUpdateResult> {
    const url = `${API_BASE_URL}/settings/me`;
    try {
      const response = await fetchWithSession(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify(payload)
      });
      const payloadJson = await readJson<unknown>(response);
      if (!response.ok) {
        let errorMessage = "Request failed";
        let fieldErrors: Record<string, string> | undefined;
        if (payloadJson && typeof payloadJson === "object" && "detail" in payloadJson) {
          const detail = (payloadJson as { detail?: unknown }).detail;
          if (typeof detail === "string") {
            errorMessage = detail;
          } else if (detail && typeof detail === "object" && "errors" in detail) {
            const errors = (detail as { errors?: Record<string, string> }).errors;
            if (errors && typeof errors === "object") {
              fieldErrors = errors;
              errorMessage = "Validation failed";
            }
          }
        }
        return {
          ok: false,
          data: null,
          error: errorMessage,
          status: response.status,
          fieldErrors
        };
      }
      return {
        ok: true,
        data: payloadJson as SettingsResponse,
        error: null,
        status: response.status
      };
    } catch (error) {
      return { ok: false, data: null, error: "API unreachable", status: 0 };
    }
  }
};
