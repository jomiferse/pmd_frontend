import { API_BASE_URL } from "./env";

export async function readJson<T>(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    return null;
  }
}

export { API_BASE_URL };
