import { apiClient } from "@/shares/lib/api/api-client";

import { IAM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { RoleDetail } from "../types/iam.types";

/** Service quyền của vai trò (BE `iam/services/role_permission_service.py`). */
export const rolePermissionService = {
  /**
   * Gán quyền cho vai trò.
   *
   * @param roleId - Id vai trò.
   * @param permissionId - Id quyền.
   * @returns Vai trò sau khi gán.
   */
  async assign(roleId: string, permissionId: string): Promise<RoleDetail> {
    return (
      await apiClient.post<RoleDetail>(IAM_API_ENDPOINTS.rolePermissions(roleId), { permissionId })
    ).data;
  },

  /**
   * Thu hồi quyền khỏi vai trò.
   *
   * @param roleId - Id vai trò.
   * @param permissionId - Id quyền.
   */
  async revoke(roleId: string, permissionId: string): Promise<void> {
    await apiClient.delete(IAM_API_ENDPOINTS.rolePermission(roleId, permissionId));
  },
};
