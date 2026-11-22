/** Tham số URL bật chế độ sửa ở trang chi tiết (`/…/{id}?mode=edit`); không có = chỉ xem. */
export const EDIT_MODE_PARAM = "mode";
/** Giá trị của `EDIT_MODE_PARAM` khi đang sửa. */
export const EDIT_MODE_VALUE = "edit";

/**
 * Thêm `?mode=edit` vào href có tham số (route chi tiết của module) để mở thẳng chế độ sửa.
 *
 * @param href - Href dạng `{ pathname, params }` (`<M>_ROUTES.xxxDetail(id)`).
 * @returns Href kèm query chế độ sửa.
 */
export function withEditMode<T extends { pathname: string; params: Record<string, string> }>(
  href: T,
): T & { query: Record<string, string> } {
  return { ...href, query: { [EDIT_MODE_PARAM]: EDIT_MODE_VALUE } };
}
