/** Quyền quản trị phiên, khớp AuthenticationPermission ở backend. */
export const AUTH_PERMISSIONS = {
  sessionDelete: "authentication.session.delete",
  sessionRead: "authentication.session.read",
  sessionRevoke: "authentication.session.revoke",
} as const;
