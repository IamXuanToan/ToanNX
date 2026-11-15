import { apiClient } from "@/shares/lib/api/api-client";
import { toPaginated } from "@/shares/lib/api/to-paginated";
import type { Paginated } from "@/shares/types/api.types";

import { AUTH_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  AdminSession,
  AdminSessionFilters,
  AdminSessionUser,
} from "../types/admin-session.types";

/** Service quản trị phiên, khớp AdminAuthSessionService của backend. */
export const adminAuthSessionService = {
  /** @param signal - Tín hiệu hủy. @returns Toàn bộ chủ phiên, không cắt danh mục ở trang đầu. */
  async listUsers(signal?: AbortSignal): Promise<AdminSessionUser[]> {
    const users: AdminSessionUser[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const result = toPaginated(
        await apiClient.get<AdminSessionUser[]>(AUTH_API_ENDPOINTS.adminSessionUsers, {
          query: { page, pageSize: 100 },
          signal,
        }),
      );
      users.push(...result.items);
      totalPages = result.pagination.totalPages;
      page += 1;
    } while (page <= totalPages);
    return users;
  },
  /** @param ids - Id phiên cần xóa mềm. @returns Số phiên đã xóa. */
  async bulkDelete(ids: string[]): Promise<number> {
    return (
      await apiClient.post<{ count: number }>(AUTH_API_ENDPOINTS.adminSessionsBulkDelete, { ids })
    ).data.count;
  },

  /** @param filters - Bộ lọc và phân trang. @param signal - Tín hiệu hủy. @returns Trang phiên. */
  async list(filters: AdminSessionFilters, signal?: AbortSignal): Promise<Paginated<AdminSession>> {
    return toPaginated(
      await apiClient.get<AdminSession[]>(AUTH_API_ENDPOINTS.adminSessions, {
        query: filters,
        signal,
      }),
    );
  },

  /** @param id - Id phiên cần thu hồi. */
  async revoke(id: string): Promise<void> {
    await apiClient.delete(AUTH_API_ENDPOINTS.adminSession(id));
  },

  /** @param ids - Id các phiên (tối đa 100). @returns Số phiên đã thu hồi. */
  async bulkRevoke(ids: string[]): Promise<number> {
    return (
      await apiClient.post<{ count: number }>(AUTH_API_ENDPOINTS.adminSessionsBulkRevoke, { ids })
    ).data.count;
  },
};
