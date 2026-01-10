import { API_BASE_URL } from "./env";
import { readJson } from "./api";
import { fetchWithRetry } from "./retry";
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
  credentials?: RequestCredentials;
  cache?: RequestCache;
};

type SettingsUpdateResult = ApiResult<SettingsResponse> & {
  fieldErrors?: Record<string, string>;
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
      const response = await fetchWithRetry(url, {
        method: "GET",
        headers: options.headers,
        credentials: options.credentials,
        cache: options.cache ?? "no-store"
      });
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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        credentials: options.credentials,
        cache: options.cache ?? "no-store",
        body: JSON.stringify(body)
      });
      return await handleResponse<T>(response);
    } catch (error) {
      return { ok: false, data: null, error: "API unreachable", status: 0 };
    }
  },
  async getSettings(): Promise<ApiResult<SettingsResponse>> {
    return apiClient.get<SettingsResponse>("/settings/me", { credentials: "include" });
  },
  async getEntitlements(): Promise<ApiResult<SettingsEntitlements>> {
    return apiClient.get<SettingsEntitlements>("/entitlements/me", { credentials: "include" });
  },
  async updateSettings(payload: SettingsPatch): Promise<SettingsUpdateResult> {
    const url = `${API_BASE_URL}/settings/me`;
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
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
