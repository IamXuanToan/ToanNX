import type { DataTableBulkStatus } from "@/shares/components/common/data-table.types";

/** Giá trị lựa chọn bật/tắt trong thanh thao tác hàng loạt. */
const ON = "on";
const OFF = "off";

/**
 * Cấu hình `bulkStatus` của `DataTable` cho một cờ boolean (đang dùng/tắt, xuất bản/ẩn…): hai lựa chọn,
 * chọn xong gọi `apply(rows, true|false)`. Mọi bảng có cờ boolean bật/tắt được dùng hàm này thay vì tự dựng
 * `options` + so chuỗi.
 *
 * @param labels - Nhãn đã dịch của trạng thái bật và tắt.
 * @param apply - Hàm cập nhật hàng loạt (thường là `bulk.bulkUpdate(rows, { isActive: value })`).
 * @returns Cấu hình `bulkStatus`.
 */
export function createBooleanBulkStatus<T>(
  labels: { on: string; off: string },
  apply: (rows: T[], value: boolean) => unknown,
): DataTableBulkStatus<T> {
  return {
    options: [
      { value: ON, label: labels.on },
      { value: OFF, label: labels.off },
    ],
    onChange: (rows, value) => apply(rows, value === ON),
  };
}
