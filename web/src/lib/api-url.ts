const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiUrl(path: string): string {
  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    return `${BASE}/_data/${path}.json`;
  }
  return `/api/${path}`;
}
