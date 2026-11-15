import type { HistoryEntry, ListParams, Paginated } from "@/shares/types/api.types";

import { apiClient, type RequestOptions } from "./api-client";
import { toPaginated } from "./to-paginated";

type Query = NonNullable<RequestOptions["query"]>;

/**
 * Service CRUD chuẩn cho một ViewSet của BE (`CoreModelViewSet`). Path theo router BE, không khai tay:
 *
 * | Method | Path |
 * | --- | --- |
 * | `list`, `create` | `base` |
 * | `get`, `update`, `delete` | `base/{id}` |
 * | `bulkUpdate`, `bulkDelete` | `base/bulk-update`, `base/bulk-delete` |
 * | `history` | `base/{id}/history` |
 *
 * Module chỉ trải ra và thêm method riêng (vẫn một file một model BE):
 *
 * ```ts
 * export const shortLinkService = {
 *   ...createCrudService<ShortLink, ShortLinkFilters, ShortLinkInput>(SHORT_LINKS_API_ENDPOINTS.links),
 *   // method riêng của tài nguyên
 * };
 * ```
 *
 * @param base - Endpoint gốc của tài nguyên (tương đối với `env.apiBasePath`).
 * @param options - `opaqueKeys`: khóa giữ nguyên nội dung khi đổi case (JSON tự do như nội dung Tiptap).
 * @returns Các hàm gọi API.
 */
export function createCrudService<
  T,
  F extends ListParams = ListParams,
  C = Partial<T>,
  U = Partial<C>,
  D = T,
>(base: string, options: { opaqueKeys?: readonly string[] } = {}) {
  const { opaqueKeys } = options;
  const item = (id: string) => `${base}/${id}`;
  return {
    /** Một trang (truyền `page`/`pageSize`). */
    async list(filters: F, signal?: AbortSignal): Promise<Paginated<T>> {
      return toPaginated(await apiClient.get<T[]>(base, { query: filters as Query, signal }));
    },
    /** Toàn bộ danh sách (không truyền `page`/`pageSize` → BE không phân trang). */
    async listAll(
      filters: Omit<F, "page" | "pageSize"> = {} as F,
      signal?: AbortSignal,
    ): Promise<T[]> {
      return (await apiClient.get<T[]>(base, { query: filters as Query, signal })).data;
    },
    async get(id: string, signal?: AbortSignal): Promise<D> {
      return (await apiClient.get<D>(item(id), { signal, opaqueKeys })).data;
    },
    async create(input: C): Promise<D> {
      return (await apiClient.post<D>(base, input, { opaqueKeys })).data;
    },
    async update(id: string, input: U): Promise<D> {
      return (await apiClient.patch<D>(item(id), input, { opaqueKeys })).data;
    },
    async delete(id: string): Promise<void> {
      await apiClient.delete(item(id));
    },
    /** Cập nhật nhiều bản ghi trong một transaction (tất cả hoặc không gì cả). @returns Số bản ghi. */
    async bulkUpdate(ids: string[], patch: Record<string, unknown>): Promise<number> {
      return (await apiClient.post<{ count: number }>(`${base}/bulk-update`, { ids, ...patch }))
        .data.count;
    },
    /** Xóa nhiều bản ghi trong một transaction. @returns Số bản ghi. */
    async bulkDelete(ids: string[]): Promise<number> {
      return (await apiClient.post<{ count: number }>(`${base}/bulk-delete`, { ids })).data.count;
    },
    /** Lịch sử thay đổi (`changes` giữ nguyên tên field của BE). */
    async history(id: string, signal?: AbortSignal): Promise<HistoryEntry[]> {
      return (
        await apiClient.get<HistoryEntry[]>(`${item(id)}/history`, {
          signal,
          opaqueKeys: ["changes"],
        })
      ).data;
    },
  };
}
