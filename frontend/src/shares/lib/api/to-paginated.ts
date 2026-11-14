import type { ApiResult, Paginated } from "@/shares/types/api.types";

/**
 * Chuyển response danh sách chuẩn thành `Paginated` (API không phân trang → một trang).
 *
 * @param result - Response `{ data, meta }`.
 * @returns Danh sách kèm thông tin phân trang.
 */
export function toPaginated<T>(result: ApiResult<T[]>): Paginated<T> {
  return {
    items: result.data,
    pagination: result.meta.pagination ?? {
      page: 1,
      pageSize: result.data.length,
      total: result.data.length,
      totalPages: 1,
    },
  };
}
