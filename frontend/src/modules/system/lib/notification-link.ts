const LEGACY_ADMIN_FINANCE_PREFIX = "/admin/finance";
const PORTAL_FINANCE_PREFIX = "/portal/finance";
const LEGACY_ADMIN_SESSIONS = "/admin/sessions";
const PORTAL_SECURITY_PROFILE = "/portal/profile?profileTab=security";

/**
 * Chuẩn hóa link thông báo cũ (`/admin/finance/...`, `/admin/sessions`) về đường dẫn Client Portal
 * để người dùng (kể cả Admin hay thành viên) bấm vào thông báo luôn mở trang Client.
 *
 * @param link - Đường dẫn thô lưu trong bản ghi thông báo.
 * @returns Đường dẫn đã chuẩn hóa sang Client Portal (hoặc giữ nguyên nếu không khớp mẫu cũ).
 */
export function resolveNotificationLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return "";
  if (trimmed === LEGACY_ADMIN_SESSIONS || trimmed.startsWith(`${LEGACY_ADMIN_SESSIONS}?`)) {
    return PORTAL_SECURITY_PROFILE;
  }
  if (
    trimmed === LEGACY_ADMIN_FINANCE_PREFIX ||
    trimmed.startsWith(`${LEGACY_ADMIN_FINANCE_PREFIX}/`)
  ) {
    return `${PORTAL_FINANCE_PREFIX}${trimmed.slice(LEGACY_ADMIN_FINANCE_PREFIX.length)}`;
  }
  return trimmed;
}
