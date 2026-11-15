import { apiClient } from "@/shares/lib/api/api-client";
import { toPaginated } from "@/shares/lib/api/to-paginated";
import type { Paginated } from "@/shares/types/api.types";

import { IAM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Role, RoleDetail, RoleFilters, RoleInput } from "../types/iam.types";

/** Service vai trò (BE `iam/services/role_service.py`). */
export const roleService = {
  /**
   * Tải đủ vai trò cho ô chọn, bao gồm cả vai trò đang tắt để lọc tài khoản đã được gán.
   *
   * @param signal - Tín hiệu hủy.
   * @returns Vai trò từ tất cả các trang.
   */
  async listAll(signal?: AbortSignal): Promise<Role[]> {
    const roles: Role[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const result = await roleService.list(
        { page, pageSize: 100, ordering: "-created_at" },
        signal,
      );
      roles.push(...result.items);
      totalPages = result.pagination.totalPages;
      page += 1;
    } while (page <= totalPages);
    return roles;
  },

  /**
   * Danh sách vai trò.
   *
   * @param filters - Từ khóa và phân trang.
   * @param signal - Tín hiệu hủy.
   * @returns Trang vai trò.
   */
  async list(filters: RoleFilters, signal?: AbortSignal): Promise<Paginated<Role>> {
    return toPaginated(
      await apiClient.get<Role[]>(IAM_API_ENDPOINTS.roles, { query: filters, signal }),
    );
  },

  /**
   * Chi tiết vai trò kèm quyền.
   *
   * @param id - Id vai trò.
   * @param signal - Tín hiệu hủy.
   * @returns Vai trò.
   */
  async get(id: string, signal?: AbortSignal): Promise<RoleDetail> {
    return (await apiClient.get<RoleDetail>(IAM_API_ENDPOINTS.role(id), { signal })).data;
  },

  /**
   * Tạo vai trò.
   *
   * @param input - Dữ liệu.
   * @returns Vai trò mới.
   */
  async create(input: RoleInput): Promise<RoleDetail> {
    return (await apiClient.post<RoleDetail>(IAM_API_ENDPOINTS.roles, input)).data;
  },

  /**
   * Cập nhật vai trò.
   *
   * @param id - Id vai trò.
   * @param input - Dữ liệu (không đổi mã).
   * @returns Vai trò.
   */
  async update(id: string, input: Omit<RoleInput, "code">): Promise<RoleDetail> {
    return (await apiClient.patch<RoleDetail>(IAM_API_ENDPOINTS.role(id), input)).data;
  },
  /**
   * Xoá mềm vai trò.
   *
   * @param id - Id vai trò.
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(IAM_API_ENDPOINTS.role(id));
  },

  /**
   * Bật/tắt nhiều vai trò cùng lúc (tất cả hoặc không gì cả).
   *
   * @param ids - Id vai trò.
   * @param isActive - Trạng thái mới.
   * @returns Số bản ghi đã cập nhật.
   */
  async bulkSetActive(ids: string[], isActive: boolean): Promise<number> {
    return (
      await apiClient.post<{ count: number }>(IAM_API_ENDPOINTS.rolesBulkUpdate, { ids, isActive })
    ).data.count;
  },

  /**
   * Xoá mềm nhiều vai trò cùng lúc (tất cả hoặc không gì cả).
   *
   * @param ids - Id vai trò.
   * @returns Số bản ghi đã xoá.
   */
  async bulkRemove(ids: string[]): Promise<number> {
    return (await apiClient.post<{ count: number }>(IAM_API_ENDPOINTS.rolesBulkDelete, { ids }))
      .data.count;
  },
};
