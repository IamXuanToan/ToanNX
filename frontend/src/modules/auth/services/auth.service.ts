import { authRepository } from "../repositories/auth.repository";
import type { CurrentUser, LoginCredentials } from "../types/auth.types";

/**
 * Kiểm tra `next` an toàn để chuyển hướng sau đăng nhập (chống open redirect).
 *
 * @param next - Giá trị query `next`.
 * @returns Đường dẫn nội bộ hoặc null.
 */
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}

/**
 * Người dùng có quyền (superuser luôn có).
 *
 * @param current - Người dùng hiện tại.
 * @param permission - Mã quyền.
 * @returns True nếu có quyền.
 */
export function hasPermission(current: CurrentUser | undefined, permission: string): boolean {
  if (!current || !current.user.isActive) return false;
  return current.user.isSuperuser || current.permissions.includes(permission);
}

/**
 * Người dùng được vào khu vực quản trị.
 *
 * @param current - Người dùng hiện tại.
 * @returns True nếu là staff hoặc superuser.
 */
export function canAccessAdmin(current: CurrentUser | undefined): boolean {
  return Boolean(current?.user.isActive && (current.user.isStaff || current.user.isSuperuser));
}

/** Nghiệp vụ xác thực phía client. */
export const authService = {
  /**
   * Đăng nhập với email đã chuẩn hóa.
   *
   * @param credentials - Thông tin đăng nhập.
   * @returns Người dùng hiện tại.
   */
  login(credentials: LoginCredentials): Promise<CurrentUser> {
    return authRepository.login({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });
  },
  getCurrentUser: authRepository.me,
  logout: authRepository.logout,
  logoutAll: authRepository.logoutAll,
};
