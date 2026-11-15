import { apiClient } from "@/shares/lib/api/api-client";

import { IAM_API_ENDPOINTS } from "../constants/api-endpoints";
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
    return (await apiClient.get<RoleSummary[]>(IAM_API_ENDPOINTS.userRoles(userId), { signal }))
      .data;
  },

  /**
   * Gán vai trò cho người dùng.
   *
   * @param userId - Id người dùng.
   * @param roleId - Id vai trò.
   * @returns Vai trò sau khi gán.
   */
  async assign(userId: string, roleId: string): Promise<RoleSummary[]> {
    return (await apiClient.post<RoleSummary[]>(IAM_API_ENDPOINTS.userRoles(userId), { roleId }))
      .data;
  },

  /**
   * Thu hồi vai trò của người dùng.
   *
   * @param userId - Id người dùng.
   * @param roleId - Id vai trò.
   */
  async revoke(userId: string, roleId: string): Promise<void> {
    await apiClient.delete(IAM_API_ENDPOINTS.userRole(userId, roleId));
  },
};
