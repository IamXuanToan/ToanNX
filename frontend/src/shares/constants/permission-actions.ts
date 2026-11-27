/** Các hành động chuẩn trong mã quyền `<module>.<resource>.<action>` (khớp catalog quyền Backend). */
export const PERMISSION_ACTION = {
  read: "read",
  create: "create",
  update: "update",
  delete: "delete",
  manageAll: "manage_all",
  readPrivate: "read_private",
  manage: "manage",
  assign: "assign",
  revoke: "revoke",
  export: "export",
  import: "import",
  chat: "chat",
  reveal: "reveal",
} as const;
