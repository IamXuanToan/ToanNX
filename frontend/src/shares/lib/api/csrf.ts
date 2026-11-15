import { env } from "@/shares/config/env";

import { SESSION_API_PATHS } from "./session-paths";

/** Tên cookie CSRF do Django đặt (khớp `CSRF_COOKIE_NAME`). */
export const CSRF_COOKIE_NAME = "csrftoken";
/** Header gửi CSRF token (khớp `CSRF_HEADER_NAME` của Django). */
export const CSRF_HEADER_NAME = "X-CSRFToken";

/**
 * Đọc CSRF token từ cookie.
 *
 * @returns Token hoặc null nếu chưa có.
 */
export function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((item) => item.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1)) : null;
}

let pending: Promise<string | null> | null = null;

/**
 * Đảm bảo có CSRF token; nếu chưa có hoặc `force` thì gọi `/auth/csrf` (single-flight).
 *
 * @param force - Bắt buộc lấy token mới (sau khi CSRF bị từ chối).
 * @returns CSRF token.
 */
export async function ensureCsrfToken(force = false): Promise<string | null> {
  const existing = readCsrfToken();
  if (existing && !force) return existing;
  pending ??= fetch(`${env.apiBasePath}${SESSION_API_PATHS.csrf}`, { credentials: "same-origin" })
    .then(() => readCsrfToken())
    .finally(() => {
      pending = null;
    });
  return pending;
}
