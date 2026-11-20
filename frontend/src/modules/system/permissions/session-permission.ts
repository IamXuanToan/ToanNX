/**
 * Quyền quản trị phiên đăng nhập, khớp `SessionPermission` ở backend.
 */
export const SESSION_PERMISSIONS = {
  sessionDelete: "system.session.delete",
  sessionRead: "system.session.read",
  sessionRevoke: "system.session.revoke",
} as const;
