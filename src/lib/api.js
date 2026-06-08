import { useAuth } from "context/AuthContext";

export async function apiFetch(path, options = {}) {
  const { getAccessToken } = options;
  const token = getAccessToken ? await getAccessToken() : null;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${response.status})`);
  }
  return response.json();
}

export function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
}

export function formatHours(ms) {
  const hours = ms / (1000 * 60 * 60);
  return `${hours.toFixed(1)}h`;
}

export function useApiFetch() {
  const { getAccessToken } = useAuth();
  return (path, options = {}) => apiFetch(path, { ...options, getAccessToken });
}
