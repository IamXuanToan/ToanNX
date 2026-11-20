import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  AdminSession,
  AdminSessionFilters,
  AdminSessionUser,
} from "../types/admin-session.types";

const crud = createCrudService<AdminSession, AdminSessionFilters>(
  SYSTEM_API_ENDPOINTS.adminSessions,
);

/** Service quản trị phiên, khớp `AdminAuthSessionViewSet` của backend. */
export const adminAuthSessionService = {
  list: crud.list,
  /** Xóa mềm nhiều phiên (action core `bulk-delete`). */
  bulkDelete: crud.bulkDelete,
  /** @param id - Phiên cần thu hồi (DELETE thu hồi, giữ lịch sử). */
  revoke: crud.delete,

  /** @param signal - Tín hiệu hủy. @returns Toàn bộ chủ phiên (không truyền `page` → BE trả hết). */
  async listUsers(signal?: AbortSignal): Promise<AdminSessionUser[]> {
    return (
      await apiClient.get<AdminSessionUser[]>(`${SYSTEM_API_ENDPOINTS.adminSessions}/users`, {
        signal,
      })
    ).data;
  },

  /** @param ids - Id các phiên (tối đa 100). @returns Số phiên đã thu hồi. */
  async bulkRevoke(ids: string[]): Promise<number> {
    return (
      await apiClient.post<{ count: number }>(`${SYSTEM_API_ENDPOINTS.adminSessions}/bulk-revoke`, {
        ids,
      })
    ).data.count;
  },
};
