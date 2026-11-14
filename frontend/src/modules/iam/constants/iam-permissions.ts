/** Mã quyền IAM (khớp backend `IamPermission`). */
export const IAM_PERMISSIONS = {
  roleRead: "iam.role.read",
  roleCreate: "iam.role.create",
  roleUpdate: "iam.role.update",
  roleAssign: "iam.role.assign",
  permissionRead: "iam.permission.read",
  permissionAssign: "iam.permission.assign",
} as const;
