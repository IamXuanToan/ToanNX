/** Một mục chọn được (vai trò, quyền, cờ trạng thái…). */
export type ChoiceItem = {
  value: string;
  label: string;
  /** Mã kỹ thuật hiển thị font mono (mã vai trò, mã quyền). */
  code?: string;
  description?: string;
  /** Nhãn nhỏ góc phải (hành động `read`, "Hệ thống", "Đang tắt"…). */
  badge?: string;
  disabled?: boolean;
};

/**
 * Cách chọn:
 * - `checkbox`: chọn nhiều rồi lưu cùng form (tạo/sửa).
 * - `switch`: cờ bật/tắt (trạng thái, truy cập), lưu cùng form.
 * - `none`: chỉ xem (danh mục).
 */
export type ChoiceControl = "checkbox" | "switch" | "none";

/**
 * Bố cục:
 * - `list`: các dòng trong một khung, ngăn bằng đường kẻ (ít mục, đọc từ trên xuống: vai trò, cờ).
 * - `grid`: card nhỏ lưới 1/2/3 cột (nhiều mục ngắn: quyền).
 */
export type ChoiceLayout = "list" | "grid";
