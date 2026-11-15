import { apiClient } from "@/shares/lib/api/api-client";
import { toPaginated } from "@/shares/lib/api/to-paginated";
import type { Paginated } from "@/shares/types/api.types";

import { ACCOUNT_API_ENDPOINTS } from "../constants/api-endpoints";
import type { CreateUserInput, UpdateUserInput, User, UserFilters } from "../types/account.types";

/** Service người dùng (BE `account/services/user_service.py`): gọi API và chuẩn hóa dữ liệu gửi đi. */
export const userService = {
  /**
   * Danh sách người dùng có phân trang.
   *
   * @param filters - Bộ lọc và phân trang.
   * @param signal - Tín hiệu hủy.
   * @returns Trang người dùng.
   */
  async list(filters: UserFilters, signal?: AbortSignal): Promise<Paginated<User>> {
    return toPaginated(
      await apiClient.get<User[]>(ACCOUNT_API_ENDPOINTS.users, { query: filters, signal }),
    );
  },

  /**
   * Chi tiết người dùng.
   *
   * @param id - Id người dùng.
   * @param signal - Tín hiệu hủy.
   * @returns Người dùng.
   */
  async get(id: string, signal?: AbortSignal): Promise<User> {
    return (await apiClient.get<User>(ACCOUNT_API_ENDPOINTS.user(id), { signal })).data;
  },

  /**
   * Tạo người dùng với email đã chuẩn hóa.
   *
   * @param input - Dữ liệu form.
   * @returns Người dùng mới.
   */
  async create(input: CreateUserInput): Promise<User> {
    const body = { ...input, email: input.email.trim().toLowerCase() };
    return (await apiClient.post<User>(ACCOUNT_API_ENDPOINTS.users, body)).data;
  },

  /**
   * Cập nhật người dùng; bỏ mật khẩu rỗng (không đổi mật khẩu).
   *
   * @param id - Id người dùng.
   * @param input - Dữ liệu form.
   * @returns Người dùng.
   */
  async update(id: string, input: UpdateUserInput): Promise<User> {
    const { password, ...rest } = input;
    const body = password ? { ...rest, password } : rest;
    return (await apiClient.patch<User>(ACCOUNT_API_ENDPOINTS.user(id), body)).data;
  },
  /**
   * Xoá mềm người dùng.
   *
   * @param id - Id người dùng.
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(ACCOUNT_API_ENDPOINTS.user(id));
  },

  /**
   * Khoá/mở nhiều người dùng cùng lúc (tất cả hoặc không gì cả).
   *
   * @param ids - Id người dùng.
   * @param isActive - Trạng thái mới.
   * @returns Số bản ghi đã cập nhật.
   */
  async bulkSetActive(ids: string[], isActive: boolean): Promise<number> {
    return (
      await apiClient.post<{ count: number }>(ACCOUNT_API_ENDPOINTS.usersBulkUpdate, {
        ids,
        isActive,
      })
    ).data.count;
  },

  /**
   * Xoá mềm nhiều người dùng cùng lúc (tất cả hoặc không gì cả).
   *
   * @param ids - Id người dùng.
   * @returns Số bản ghi đã xoá.
   */
  async bulkRemove(ids: string[]): Promise<number> {
    return (await apiClient.post<{ count: number }>(ACCOUNT_API_ENDPOINTS.usersBulkDelete, { ids }))
      .data.count;
  },
};
