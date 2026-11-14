import { iamRepository } from "../repositories/iam.repository";
import type { Permission } from "../types/iam.types";

/**
 * Gom quyền theo module để hiển thị.
 *
 * @param permissions - Danh sách quyền.
 * @returns Mảng [module, quyền[]] sắp theo mã module.
 */
export function groupPermissionsByModule(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/** Nghiệp vụ IAM phía client. */
export const iamService = {
  ...iamRepository,
};
