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

export const apiDownload = async (path: string, filename: string) => {
  const url = new URL(path, apiBaseUrl);
  const headers = new Headers();
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    let detail: unknown = null;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }
    throw new Error(
      `Export failed (${response.status} ${response.statusText}): ${
        typeof detail === "string" ? detail : JSON.stringify(detail)
      }`
    );
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
};
