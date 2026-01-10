type RetryOptions = {
  retries?: number;
};

export async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  { retries = 1 }: RetryOptions = {}
) {
  const method = (init?.method || "GET").toUpperCase();
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(input, init);
      if (method === "GET" && response.status >= 500 && attempt < retries) {
        attempt += 1;
        continue;
      }
      return response;
    } catch (error) {
      if (method === "GET" && attempt < retries) {
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
}
