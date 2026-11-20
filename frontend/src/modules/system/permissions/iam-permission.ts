/** Mã quyền IAM (khớp backend `IamPermission`). */
export const IAM_PERMISSIONS = {
  roleRead: "system.role.read",
  roleCreate: "system.role.create",
  roleUpdate: "system.role.update",
  roleDelete: "system.role.delete",
  roleAssign: "system.role.assign",
  permissionRead: "system.permission.read",
  permissionAssign: "system.permission.assign",
} as const;
