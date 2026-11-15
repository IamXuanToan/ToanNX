import { apiClient } from "@/shares/lib/api/api-client";

import { IAM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { RoleDetail } from "../types/iam.types";

/** Service quyền của vai trò (BE `iam/services/role_permission_service.py`). */
export const rolePermissionService = {
  /**
   * Thay toàn bộ quyền của vai trò trong một transaction (lỗi một quyền thì không đổi gì).
   *
   * @param roleId - Id vai trò.
   * @param permissionIds - Toàn bộ id quyền mong muốn.
   * @returns Vai trò sau khi đồng bộ.
   */
  async sync(roleId: string, permissionIds: readonly string[]): Promise<RoleDetail> {
    return (
      await apiClient.put<RoleDetail>(IAM_API_ENDPOINTS.rolePermissions(roleId), { permissionIds })
    ).data;
  },
};
