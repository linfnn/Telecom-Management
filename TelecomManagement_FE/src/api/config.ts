function parseTimeout(rawTimeout: string | undefined): number {
  const parsed = Number(rawTimeout);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : import.meta.env.VITE_DEFAULT_API_TIMEOUT_MS;
}

export const API_BASE_URL = import.meta.env.VITE_DEFAULT_API_BASE_URL;

export const API_TIMEOUT_MS = parseTimeout(
  import.meta.env.VITE_DEFAULT_API_TIMEOUT_MS,
);
