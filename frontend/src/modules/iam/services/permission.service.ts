import { apiClient } from "@/shares/lib/api/api-client";

import { IAM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Permission } from "../types/iam.types";

/**
 * Gom quyền theo module để hiển thị.
 *
 * @param permissions - Danh sách quyền.
 * @returns Mảng [module, quyền[]] sắp theo mã module.
 */
export function groupPermissionsByModule(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/** Service quyền (BE `iam/services/permission_service.py`). */
export const permissionService = {
  /**
   * Danh sách quyền.
   *
   * @param signal - Tín hiệu hủy.
   * @returns Quyền.
   */
  async list(signal?: AbortSignal): Promise<Permission[]> {
    // Danh mục: không truyền `page` → BE trả toàn bộ, không cần tải từng trang.
    return (
      await apiClient.get<Permission[]>(IAM_API_ENDPOINTS.permissions, {
        query: { ordering: "-created_at" },
        signal,
      })
    ).data;
  },
};
