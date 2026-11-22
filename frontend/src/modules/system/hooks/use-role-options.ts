"use client";

import { useQuery } from "@tanstack/react-query";

import { iamKeys } from "../constants/query-keys";
import { roleService } from "../services/role.service";

/** @returns Vai trò dạng lựa chọn `{ value, label }` (chọn đối tượng nhận thông báo hệ thống). */
export function useRoleOptions() {
  const query = useQuery({
    queryKey: [...iamKeys.all, "role-options"],
    queryFn: ({ signal }) => roleService.listAll(signal),
  });
  return (query.data ?? []).map((role) => ({
    value: role.id,
    label: role.name,
    description: role.code,
  }));
}
