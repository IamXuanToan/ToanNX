/** Mã quyền QR Codes (khớp backend `QrCodesPermission`). */
export const QR_CODES_PERMISSIONS = {
  read: "qr_codes.code.read",
  create: "qr_codes.code.create",
  update: "qr_codes.code.update",
  delete: "qr_codes.code.delete",
  manageAll: "qr_codes.code.manage_all",
} as const;
