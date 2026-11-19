/**
 * Danh mục quyền hạn đối với tài nguyên Mã QR (QrCode).
 *
 * Khớp backend `QrCodePermission`.
 */
export const QR_CODE_PERMISSIONS = {
  read: "qr_codes.code.read",
  create: "qr_codes.code.create",
  update: "qr_codes.code.update",
  delete: "qr_codes.code.delete",
  manageAll: "qr_codes.code.manage_all",
} as const;
