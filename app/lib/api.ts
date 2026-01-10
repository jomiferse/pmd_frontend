import { API_BASE_URL } from "./env";
import { fetchWithRetry } from "./retry";

type ApiResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
  status: number;
};

function buildQuery(params?: Record<string, string | number | undefined | null>) {
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

export async function apiFetch<T>(
  path: string,
  apiKey: string | null,
  params?: Record<string, string | number | undefined | null>
): Promise<ApiResult<T>> {
  if (!apiKey) {
    return { ok: false, data: null, error: "Missing API key", status: 401 };
  }
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}${path}${buildQuery(params)}`, {
      headers: {
        "X-API-Key": apiKey
      },
      cache: "no-store"
    });
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
  } catch (error) {
    return { ok: false, data: null, error: "API unreachable", status: 0 };
  }
}

export async function readJson<T>(response: Response) {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

export { API_BASE_URL };
