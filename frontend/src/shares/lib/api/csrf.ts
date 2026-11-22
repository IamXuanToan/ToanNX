import { env } from "@/shares/config/env";

import { SESSION_API_PATHS } from "./session-paths";

/** Tên cookie CSRF do Django đặt (khớp `CSRF_COOKIE_NAME`). */
export const CSRF_COOKIE_NAME = "csrftoken";
/** Header gửi CSRF token (khớp `CSRF_HEADER_NAME` của Django). */
export const CSRF_HEADER_NAME = "X-CSRFToken";

/** Lưu CSRF token trong bộ nhớ khi cross-origin (document.cookie không đọc được cookie của subdomain API). */
let inMemoryCsrfToken: string | null = null;

/**
 * Đọc CSRF token từ cookie hoặc bộ nhớ.
 *
 * @returns Token hoặc null nếu chưa có.
 */
export function readCsrfToken(): string | null {
  if (typeof document !== "undefined") {
    const match = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${CSRF_COOKIE_NAME}=`));
    if (match) return decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1));
  }
  return inMemoryCsrfToken;
}

let pending: Promise<string | null> | null = null;

/**
 * Đảm bảo có CSRF token; nếu chưa có hoặc `force` thì gọi `/system/auth/csrf` (single-flight).
 *
 * @param force - Bắt buộc lấy token mới (sau khi CSRF bị từ chối).
 * @returns CSRF token.
 */
export async function ensureCsrfToken(force = false): Promise<string | null> {
  const existing = readCsrfToken();
  if (existing && !force) return existing;
  pending ??= fetch(`${env.apiBaseUrl}${SESSION_API_PATHS.csrf}`, { credentials: "include" })
    .then(async (res) => {
      if (res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          data?: { csrf_token?: string; csrfToken?: string };
        } | null;
        const token = payload?.data?.csrf_token ?? payload?.data?.csrfToken;
        if (token) {
          inMemoryCsrfToken = token;
          return token;
        }
      }
      return readCsrfToken();
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
