/** Endpoint API của module Home (tương đối với `env.apiBasePath`). */
export const HOME_API_ENDPOINTS = {
  /** Báo lỗi trình duyệt về BE (ghi log, Sentry khi bật). */
  clientErrors: "/health/client-errors",
} as const;
