import { env } from "@/shares/config/env";
import type { ApiMeta, ApiResult } from "@/shares/types/api.types";
import { useAuthStore } from "@/store/auth-store";

import { ApiError, CLIENT_ERROR_CODES } from "./api-error";
import { PATHS_WITHOUT_REFRESH, SESSION_API_PATHS } from "./session-paths";
import { keysToCamel, keysToSnake } from "./case-conversion";
import { CSRF_HEADER_NAME, ensureCsrfToken } from "./csrf";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type RequestOptions = {
  /**
   * Query string (camelCase, sẽ chuyển snake_case). Giá trị rỗng/undefined bị bỏ qua.
   * Mảng (bộ lọc nhiều giá trị) gửi dạng phân tách dấu phẩy: `status=ACTIVE,EXPIRED`.
   */
  query?: Record<string, string | number | boolean | readonly string[] | null | undefined>;
  /** Body JSON (camelCase) hoặc FormData/Blob (gửi nguyên trạng). */
  body?: unknown;
  /** Tín hiệu hủy (React Query truyền vào). */
  signal?: AbortSignal;
  /** Khóa giữ nguyên nội dung khi chuyển đổi case. */
  opaqueKeys?: readonly string[];
};

const SAFE_METHODS: readonly HttpMethod[] = ["GET"];
/** Mã 401 có thể khắc phục bằng refresh. */
const REFRESHABLE_CODES = new Set([
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_INVALID",
  "AUTH_NOT_AUTHENTICATED",
  "AUTH_SESSION_INVALID",
]);

let refreshInFlight: Promise<boolean> | null = null;

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(query ?? {})) {
    const value = Array.isArray(raw) ? raw.join(",") : raw;
    if (value !== undefined && value !== null && value !== "") {
      params.set(key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase(), String(value));
    }
  }
  const search = params.toString();
  return `${env.apiBasePath}${path}${search ? `?${search}` : ""}`;
}

function isRawBody(body: unknown): body is BodyInit {
  return (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  );
}

async function send(method: HttpMethod, path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers({ Accept: "application/json", "X-Request-ID": crypto.randomUUID() });
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (isRawBody(options.body)) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(keysToSnake(options.body, { opaqueKeys: options.opaqueKeys }));
    }
  }
  if (!SAFE_METHODS.includes(method)) {
    const token = await ensureCsrfToken();
    if (token) headers.set(CSRF_HEADER_NAME, token);
  }

  // Hết thời gian chờ → hủy request; vẫn tôn trọng tín hiệu hủy từ bên ngoài.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), env.apiTimeoutMs);
  options.signal?.addEventListener("abort", () => controller.abort(options.signal?.reason), {
    once: true,
  });
  try {
    return await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.reason === "timeout") {
      throw new ApiError({
        status: 0,
        code: CLIENT_ERROR_CODES.timeout,
        message: "Request timeout",
      });
    }
    if (options.signal?.aborted) throw error;
    throw new ApiError({ status: 0, code: CLIENT_ERROR_CODES.network, message: "Network error" });
  } finally {
    clearTimeout(timeout);
  }
}

async function parse<T>(response: Response, opaqueKeys?: readonly string[]): Promise<ApiResult<T>> {
  if (response.status === 204) {
    return {
      data: undefined as T,
      meta: { requestId: response.headers.get("X-Request-ID"), timestamp: "" },
    };
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError({
      status: response.status,
      code: CLIENT_ERROR_CODES.invalidResponse,
      message: "Invalid response",
      requestId: response.headers.get("X-Request-ID"),
    });
  }
  const body = payload as {
    success?: boolean;
    data?: unknown;
    meta?: unknown;
    error?: Record<string, unknown>;
  };
  if (!response.ok || body.success === false) {
    const error = body.error ?? {};
    throw new ApiError({
      status: response.status,
      code: String(error.code ?? CLIENT_ERROR_CODES.invalidResponse),
      message: String(error.message ?? response.statusText),
      details: (error.details as Record<string, unknown>) ?? {},
      requestId: (error.request_id as string | null) ?? response.headers.get("X-Request-ID"),
    });
  }
  return {
    data: keysToCamel<T>(body.data, { opaqueKeys }),
    meta: keysToCamel<ApiMeta>(body.meta ?? {}),
  };
}

/**
 * Làm mới phiên bằng refresh cookie (single-flight: nhiều 401 cùng lúc chỉ gọi refresh một lần).
 * 409 AUTH_REFRESH_CONFLICT nghĩa là tab/request khác vừa xoay vòng token → cookie đã mới, coi là thành công.
 *
 * @returns True nếu phiên còn hiệu lực.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await send("POST", SESSION_API_PATHS.refresh, {});
      if (response.ok) return true;
      const body = (await response.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;
      return response.status === 409 && body?.error?.code === "AUTH_REFRESH_CONFLICT";
    } catch {
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  let response = await send(method, path, options);

  // CSRF token có thể đã xoay vòng (sau đăng nhập): lấy token mới và thử lại đúng một lần.
  if (response.status === 403) {
    const code = (
      await response
        .clone()
        .json()
        .catch(() => null)
    )?.error?.code;
    if (code === "AUTH_CSRF_FAILED") {
      await ensureCsrfToken(true);
      response = await send(method, path, options);
    }
  }

  // 401 do xác thực thất bại xảy ra TRƯỚC khi view xử lý nghiệp vụ, nên thử lại một lần
  // sau refresh là an toàn kể cả với POST/PATCH. Không bao giờ thử lại quá một lần.
  if (response.status === 401 && !PATHS_WITHOUT_REFRESH.includes(path)) {
    const code = (
      await response
        .clone()
        .json()
        .catch(() => null)
    )?.error?.code;
    if (REFRESHABLE_CODES.has(code)) {
      if (await refreshSession()) {
        response = await send(method, path, options);
      } else {
        useAuthStore.getState().markSessionExpired();
      }
    }
  }
  return parse<T>(response, options.opaqueKeys);
}

/** Client API tập trung. Service của module dùng client này; component, hook không gọi trực tiếp. */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T = void>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
