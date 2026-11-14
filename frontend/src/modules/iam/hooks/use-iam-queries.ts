"use client";

import { useQuery } from "@tanstack/react-query";

import { iamKeys } from "@/shares/constants/query-keys";

import { iamService } from "../services/iam.service";

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
    queryFn: ({ signal }) => iamService.listUserRoles(userId, signal),
    enabled: options.enabled ?? true,
  });
}

/**
 * Danh sách vai trò.
 *
 * @param options - `enabled` để chỉ tải khi cần.
 * @returns Truy vấn React Query.
 */
export function useRoles(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: iamKeys.roles({ page: 1 }),
    queryFn: ({ signal }) => iamService.listRoles(1, signal),
    enabled: options.enabled ?? true,
  });
}

/**
 * Chi tiết vai trò kèm quyền.
 *
 * @param id - Id vai trò.
 * @returns Truy vấn React Query.
 */
export function useRole(id: string) {
  return useQuery({
    queryKey: iamKeys.role(id),
    queryFn: ({ signal }) => iamService.getRole(id, signal),
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
    queryFn: ({ signal }) => iamService.listPermissions(signal),
    staleTime: Infinity,
    enabled: options.enabled ?? true,
  });
}
