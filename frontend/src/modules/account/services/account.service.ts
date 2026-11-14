import { accountRepository } from "../repositories/account.repository";
import type { CreateUserInput, UpdateUserInput } from "../types/account.types";

/** Nghiệp vụ Account phía client: chuẩn hóa dữ liệu trước khi gửi. */
export const accountService = {
  ...accountRepository,

  /**
   * Tạo người dùng với email đã chuẩn hóa.
   *
   * @param input - Dữ liệu form.
   * @returns Người dùng mới.
   */
  createUser(input: CreateUserInput) {
    return accountRepository.createUser({ ...input, email: input.email.trim().toLowerCase() });
  },

  /**
   * Cập nhật người dùng; bỏ mật khẩu rỗng (không đổi mật khẩu).
   *
   * @param id - Id người dùng.
   * @param input - Dữ liệu form.
   * @returns Người dùng.
   */
  updateUser(id: string, input: UpdateUserInput) {
    const { password, ...rest } = input;
    return accountRepository.updateUser(id, password ? { ...rest, password } : rest);
  },
};
