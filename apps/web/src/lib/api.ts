import { getToken } from "./auth";

const fallbackBaseUrl = "http://localhost:8787";

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.toString().trim() || fallbackBaseUrl;

type ApiFetchOptions = RequestInit & { auth?: boolean };

export const apiFetch = async (path: string, init: ApiFetchOptions = {}) => {
  const url = new URL(path, apiBaseUrl);
  const headers = new Headers(init.headers);

  if (init.auth !== false) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url.toString(), { ...init, headers });

  if (!response.ok) {
    let detail: unknown = null;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }
    throw new Error(
      `API request failed (${response.status} ${response.statusText}): ${
        typeof detail === "string" ? detail : JSON.stringify(detail)
      }`
    );
  }

  return response.json();
};
