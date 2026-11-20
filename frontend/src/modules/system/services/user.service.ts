import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { CreateUserInput, UpdateUserInput, User, UserFilters } from "../types/user.types";

const crud = createCrudService<User, UserFilters, CreateUserInput, UpdateUserInput>(
  SYSTEM_API_ENDPOINTS.users,
);

/** Service người dùng (BE `account/services/user_service.py`): CRUD chuẩn + chuẩn hóa dữ liệu gửi đi. */
export const userService = {
  ...crud,

  /** @param input - Dữ liệu form. @returns Người dùng mới (email đã chuẩn hóa). */
  create(input: CreateUserInput): Promise<User> {
    return crud.create({ ...input, email: input.email.trim().toLowerCase() });
  },

  /** @param id - Id. @param input - Dữ liệu form; mật khẩu rỗng = giữ nguyên. @returns Người dùng. */
  update(id: string, input: UpdateUserInput): Promise<User> {
    const { password, ...rest } = input;
    return crud.update(id, password ? { ...rest, password } : rest);
  },

  /** @param ids - Id. @param isActive - Khóa/mở. @returns Số bản ghi (tất cả hoặc không gì cả). */
  bulkSetActive(ids: string[], isActive: boolean): Promise<number> {
    return crud.bulkUpdate(ids, { isActive });
  },
};
