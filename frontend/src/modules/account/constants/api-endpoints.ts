/**
 * Endpoint API của module Account (tương đối với `env.apiBasePath`).
 * Chỉ khai path gốc của tài nguyên; `{id}`, `bulk-*`, `history` do `createCrudService` dựng theo router BE.
 */
export const ACCOUNT_API_ENDPOINTS = {
  users: "/account/users",
} as const;
