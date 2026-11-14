import { API_ENDPOINTS } from "@/shares/constants/api-endpoints";
import { apiClient } from "@/shares/lib/api/api-client";
import { toPaginated } from "@/shares/lib/api/to-paginated";
import type { Paginated } from "@/shares/types/api.types";

import type { CreateUserInput, UpdateUserInput, User, UserFilters } from "../types/account.types";

/** Gọi API Account. Không chứa React hook hay UI state. */
export const accountRepository = {
  /** Danh sách người dùng có phân trang. @param filters - Bộ lọc. @param signal - Tín hiệu hủy. @returns Trang người dùng. */
  async listUsers(filters: UserFilters, signal?: AbortSignal): Promise<Paginated<User>> {
    return toPaginated(
      await apiClient.get<User[]>(API_ENDPOINTS.account.users, { query: filters, signal }),
    );
  },
  /** Chi tiết người dùng. @param id - Id. @param signal - Tín hiệu hủy. @returns Người dùng. */
  async getUser(id: string, signal?: AbortSignal): Promise<User> {
    return (await apiClient.get<User>(API_ENDPOINTS.account.user(id), { signal })).data;
  },
  /** Tạo người dùng. @param input - Dữ liệu. @returns Người dùng mới. */
  async createUser(input: CreateUserInput): Promise<User> {
    return (await apiClient.post<User>(API_ENDPOINTS.account.users, input)).data;
  },
  /** Cập nhật người dùng. @param id - Id. @param input - Dữ liệu. @returns Người dùng. */
  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    return (await apiClient.patch<User>(API_ENDPOINTS.account.user(id), input)).data;
  },
};
