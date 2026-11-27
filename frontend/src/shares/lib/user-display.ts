/** Nguồn dữ liệu người dùng tối thiểu để dựng nhãn hiển thị thống nhất toàn hệ thống. */
export type UserDisplaySource =
  | {
      fullName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      email?: string | null;
    }
  | null
  | undefined;

/**
 * Định dạng nhãn hiển thị người dùng/người tạo/chủ sở hữu theo chuẩn:
 * - Có cả họ tên và username: `fullname (username)` (ví dụ: `Nguyễn Xuân Toàn (toannx)`)
 * - Chỉ có username (không có fullname): `username`
 * - Chỉ có fullname (không có username): `fullname`
 * - Thiếu cả hai: fallback về `email` hoặc chuỗi rỗng.
 *
 * @param user - Đối tượng chứa thông tin định danh người dùng.
 * @returns Chuỗi nhãn hiển thị đã chuẩn hóa.
 */
export function formatUserDisplayName(
  user: UserDisplaySource,
  options?: { includeUsername?: boolean },
): string {
  if (!user) return "";

  const includeUsername = options?.includeUsername ?? true;
  const explicitFullName = user.fullName?.trim() ?? "";
  const combinedParts = [user.lastName?.trim(), user.firstName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fullName = explicitFullName || combinedParts;
  const username = user.username?.trim() ?? "";

  if (includeUsername && fullName && username) {
    return `${fullName} (${username})`;
  }
  if (fullName) {
    return fullName;
  }
  if (username) {
    return username;
  }
  return user.email?.trim() ?? "";
}

/**
 * Định dạng nhãn chủ sở hữu từ các trường phẳng `ownerName` / `ownerUsername` / `ownerEmail`
 * thường trả về ở bảng Finance và Workspace.
 *
 * @param owner - Bản ghi chứa thông tin chủ sở hữu phẳng.
 * @returns Chuỗi nhãn hiển thị `fullname (username)` hoặc `username`.
 */
export function formatOwnerDisplayName(
  owner:
    | {
        ownerName?: string | null;
        ownerUsername?: string | null;
        ownerEmail?: string | null;
      }
    | null
    | undefined,
): string {
  if (!owner) return "";
  return formatUserDisplayName({
    fullName: owner.ownerName,
    username: owner.ownerUsername,
    email: owner.ownerEmail,
  });
}

/**
 * Dựng nội dung tooltip đầy đủ cho người dùng bị cắt gọn trong bảng/cột:
 * luôn ưu tiên hiển thị đầy đủ `fullname (username)` (hoặc `username`), kèm email phụ nếu khác nhãn.
 *
 * @param user - Đối tượng chứa thông tin người dùng.
 * @returns Chuỗi tooltip đầy đủ hoặc `undefined` khi không có thông tin.
 */
export function formatUserDisplayTooltip(user: UserDisplaySource): string | undefined {
  const displayName = formatUserDisplayName(user);
  const email = user?.email?.trim() ?? "";
  if (!displayName) return email || undefined;
  if (email && email !== displayName) {
    return `${displayName} · ${email}`;
  }
  return displayName;
}

/**
 * Dựng nội dung tooltip đầy đủ cho chủ sở hữu từ dữ liệu phẳng `ownerName` / `ownerUsername` / `ownerEmail`.
 *
 * @param owner - Bản ghi chứa thông tin chủ sở hữu phẳng.
 * @returns Chuỗi tooltip đầy đủ (`fullname (username) · email`) hoặc `undefined`.
 */
export function formatOwnerDisplayTooltip(
  owner:
    | {
        ownerName?: string | null;
        ownerUsername?: string | null;
        ownerEmail?: string | null;
      }
    | null
    | undefined,
): string | undefined {
  if (!owner) return undefined;
  return formatUserDisplayTooltip({
    fullName: owner.ownerName,
    username: owner.ownerUsername,
    email: owner.ownerEmail,
  });
}
