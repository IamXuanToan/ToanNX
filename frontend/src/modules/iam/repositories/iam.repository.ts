import { API_ENDPOINTS } from "@/shares/constants/api-endpoints";
import { apiClient } from "@/shares/lib/api/api-client";
import { toPaginated } from "@/shares/lib/api/to-paginated";
import type { Paginated } from "@/shares/types/api.types";

import type { Permission, Role, RoleDetail, RoleInput, RoleSummary } from "../types/iam.types";

/** Gọi API IAM. Không chứa React hook hay UI state. */
export const iamRepository = {
  /** Vai trò của người dùng. @param userId - Id người dùng. @param signal - Tín hiệu hủy. @returns Vai trò. */
  async listUserRoles(userId: string, signal?: AbortSignal): Promise<RoleSummary[]> {
    return (await apiClient.get<RoleSummary[]>(API_ENDPOINTS.iam.userRoles(userId), { signal }))
      .data;
  },
  /** Gán vai trò. @param userId - Id người dùng. @param roleId - Id vai trò. @returns Vai trò sau khi gán. */
  async assignRole(userId: string, roleId: string): Promise<RoleSummary[]> {
    return (await apiClient.post<RoleSummary[]>(API_ENDPOINTS.iam.userRoles(userId), { roleId }))
      .data;
  },
  /** Thu hồi vai trò. @param userId - Id người dùng. @param roleId - Id vai trò. */
  async revokeRole(userId: string, roleId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.iam.userRole(userId, roleId));
  },
  /** Danh sách vai trò. @param page - Trang. @param signal - Tín hiệu hủy. @returns Trang vai trò. */
  async listRoles(page: number, signal?: AbortSignal): Promise<Paginated<Role>> {
    return toPaginated(
      await apiClient.get<Role[]>(API_ENDPOINTS.iam.roles, {
        query: { page, pageSize: 100 },
        signal,
      }),
    );
  },
  /** Chi tiết vai trò. @param id - Id. @param signal - Tín hiệu hủy. @returns Vai trò kèm quyền. */
  async getRole(id: string, signal?: AbortSignal): Promise<RoleDetail> {
    return (await apiClient.get<RoleDetail>(API_ENDPOINTS.iam.role(id), { signal })).data;
  },
  /** Tạo vai trò. @param input - Dữ liệu. @returns Vai trò mới. */
  async createRole(input: RoleInput): Promise<RoleDetail> {
    return (await apiClient.post<RoleDetail>(API_ENDPOINTS.iam.roles, input)).data;
  },
  /** Cập nhật vai trò. @param id - Id. @param input - Dữ liệu. @returns Vai trò. */
  async updateRole(id: string, input: Omit<RoleInput, "code">): Promise<RoleDetail> {
    return (await apiClient.patch<RoleDetail>(API_ENDPOINTS.iam.role(id), input)).data;
  },
  /** Gán quyền cho vai trò. @param roleId - Id vai trò. @param permissionId - Id quyền. @returns Vai trò. */
  async assignPermission(roleId: string, permissionId: string): Promise<RoleDetail> {
    return (
      await apiClient.post<RoleDetail>(API_ENDPOINTS.iam.rolePermissions(roleId), { permissionId })
    ).data;
  },
  /** Thu hồi quyền khỏi vai trò. @param roleId - Id vai trò. @param permissionId - Id quyền. */
  async revokePermission(roleId: string, permissionId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.iam.rolePermission(roleId, permissionId));
  },
  /** Danh sách quyền. @param signal - Tín hiệu hủy. @returns Quyền. */
  async listPermissions(signal?: AbortSignal): Promise<Permission[]> {
    return (await apiClient.get<Permission[]>(API_ENDPOINTS.iam.permissions, { signal })).data;
  },
};
