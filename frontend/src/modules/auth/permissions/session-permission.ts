/**
 * Quyền quản trị phiên đăng nhập, khớp `SessionPermission` ở backend.
 */
export const SESSION_PERMISSIONS = {
  sessionDelete: "authentication.session.delete",
  sessionRead: "authentication.session.read",
  sessionRevoke: "authentication.session.revoke",
} as const;
