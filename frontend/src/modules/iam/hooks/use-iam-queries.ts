"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { iamKeys } from "../constants/query-keys";
import { permissionService } from "../services/permission.service";
import { roleService } from "../services/role.service";
import { userRoleService } from "../services/user-role.service";
import type { RoleFilters } from "../types/iam.types";

/** @returns Đủ vai trò cho bộ lọc và ô chọn, không cắt ở trang đầu. */
export function useRoleOptions(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: iamKeys.roleOptions(),
    queryFn: ({ signal }) => roleService.listAll(signal),
    enabled: options.enabled ?? true,
  });
}

/**
 * Vai trò đang gán cho người dùng.
 *
 * @param userId - Id người dùng.
 * @param options - `enabled` để chỉ tải khi có quyền.
 * @returns Truy vấn React Query.
 */
export function useUserRoles(userId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: iamKeys.userRoles(userId),
    queryFn: ({ signal }) => userRoleService.list(userId, signal),
    enabled: options.enabled ?? true,
  });
}

/**
 * Danh sách vai trò (giữ dữ liệu trang trước khi chuyển trang).
 *
 * @param filters - Từ khóa và phân trang.
 * @param options - `enabled` để chỉ tải khi cần.
 * @returns Truy vấn React Query.
 */
export function useRoles(filters: RoleFilters, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: iamKeys.roles(filters),
    queryFn: ({ signal }) => roleService.list(filters, signal),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

/**
 * Chi tiết vai trò kèm quyền.
 *
 * @param id - Id vai trò.
 * @param options - `enabled` để chỉ tải khi cần (ví dụ sao chép).
 * @returns Truy vấn React Query.
 */
export function useRole(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: iamKeys.role(id),
    queryFn: ({ signal }) => roleService.get(id, signal),
    enabled: options.enabled ?? true,
  });
}

/**
 * Danh sách quyền.
 *
 * @param options - `enabled` để chỉ tải khi có quyền xem.
 * @returns Truy vấn React Query.
 */
export function usePermissions(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: iamKeys.permissions(),
    queryFn: ({ signal }) => permissionService.list(signal),
    staleTime: Infinity,
    enabled: options.enabled ?? true,
  });
}
