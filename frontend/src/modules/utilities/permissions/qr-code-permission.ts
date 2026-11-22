/**
 * Danh mục quyền hạn đối với tài nguyên Mã QR (QrCode).
 *
 * Khớp backend `QrCodePermission`.
 */
export const QR_CODE_PERMISSIONS = {
  read: "utilities.qr_code.read",
  create: "utilities.qr_code.create",
  update: "utilities.qr_code.update",
  delete: "utilities.qr_code.delete",
  manageAll: "utilities.qr_code.manage_all",
} as const;
