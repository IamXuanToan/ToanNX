import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { RoleSummary } from "../types/iam.types";

/** Service vai trò của người dùng (BE `iam/services/user_role_service.py`). */
export const userRoleService = {
  /**
   * Vai trò đang gán cho người dùng.
   *
   * @param userId - Id người dùng.
   * @param signal - Tín hiệu hủy.
   * @returns Vai trò.
   */
  async list(userId: string, signal?: AbortSignal): Promise<RoleSummary[]> {
    return (await apiClient.get<RoleSummary[]>(SYSTEM_API_ENDPOINTS.userRoles(userId), { signal }))
      .data;
  },

  /**
   * Thay toàn bộ vai trò của người dùng trong một transaction (lỗi một vai trò thì không đổi gì).
   *
   * @param userId - Id người dùng.
   * @param roleIds - Toàn bộ id vai trò mong muốn.
   * @returns Vai trò sau khi đồng bộ.
   */
  async sync(userId: string, roleIds: readonly string[]): Promise<RoleSummary[]> {
    return (await apiClient.put<RoleSummary[]>(SYSTEM_API_ENDPOINTS.userRoles(userId), { roleIds }))
      .data;
  },
};
