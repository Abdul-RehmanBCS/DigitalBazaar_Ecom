function trim(value) {
  return value?.trim()?.replace(/\/$/, "") || "";
}

export function getApiRoot() {
  return trim(import.meta.env.VITE_API_ROOT);
}

export function getApiBaseUrl() {
  const root = getApiRoot();
  if (!root) {
    throw new Error("VITE_API_ROOT is required");
  }
  return `${root}/api`;
}

export function getSiteUrl() {
  const configured = trim(import.meta.env.VITE_SITE_URL);
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
