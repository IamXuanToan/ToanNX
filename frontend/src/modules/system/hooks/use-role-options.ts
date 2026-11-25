"use client";

import { useQuery } from "@tanstack/react-query";

import { iamKeys } from "../constants/query-keys";
import { IAM_PERMISSIONS } from "../permissions/iam-permission";
import { roleService } from "../services/role.service";
import { usePermission } from "./use-permission";

/** @returns Vai trò dạng lựa chọn `{ value, label }` (chọn đối tượng nhận thông báo hệ thống). */
export function useRoleOptions() {
  const canReadRoles = usePermission(IAM_PERMISSIONS.roleRead);
  const query = useQuery({
    queryKey: [...iamKeys.all, "role-options"],
    queryFn: ({ signal }) => roleService.listAll(signal),
    enabled: canReadRoles,
  });
  return (query.data ?? []).map((role) => ({
    value: role.id,
    label: role.name,
    description: role.code,
  }));
}
