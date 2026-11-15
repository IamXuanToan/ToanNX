// Chỉ import từ code chạy phía server (route handler, server component).

import { keysToCamel } from "./case-conversion";

/** Origin của Django (chỉ dùng phía server, không lộ ra bundle client). */
const BACKEND_ORIGIN = (process.env.BACKEND_ORIGIN ?? "http://localhost:8000").replace(/\/$/, "");
const API_BASE = "/api/v1";
const FORWARDED_HEADERS = [
  "cookie",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "accept-language",
];

/**
 * Gọi Django từ server (route handler, server component) kèm header cần thiết của request gốc:
 * cookie (để BE biết ai đang xem), IP và host gốc (rate limit, URL tuyệt đối).
 *
 * @param path - Path tương đối `/api/v1` (ví dụ `/short_links/resolve/abc`).
 * @param source - Header của request gốc.
 * @param init - Tùy chọn fetch thêm.
 * @returns Response gốc của Django.
 */
export function backendFetch(
  path: string,
  source: Headers,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  for (const name of FORWARDED_HEADERS) {
    const value = source.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("x-forwarded-host") && source.get("host"))
    headers.set("x-forwarded-host", source.get("host")!);
  headers.set("accept", "application/json");
  return fetch(`${BACKEND_ORIGIN}${API_BASE}${path}`, { cache: "no-store", ...init, headers });
}

/**
 * GET envelope chuẩn `{success, data}` từ server.
 *
 * @param path - Path tương đối `/api/v1`.
 * @param source - Header của request gốc.
 * @param options - `opaqueKeys` giữ nguyên nội dung (JSON tự do như Tiptap).
 * @returns `{status, data}`; `data` null khi lỗi.
 */
export async function serverApiGet<T>(
  path: string,
  source: Headers,
  options: { opaqueKeys?: readonly string[] } = {},
): Promise<{ status: number; data: T | null; headers: Headers }> {
  const response = await backendFetch(path, source);
  if (!response.ok) return { status: response.status, data: null, headers: response.headers };
  const body = (await response.json()) as { data?: unknown };
  return {
    status: response.status,
    data: keysToCamel<T>(body.data, { opaqueKeys: options.opaqueKeys }),
    headers: response.headers,
  };
}
