import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { Pagination } from "@/shares/types/api.types";

/**
 * Vai trò của cột trên card mobile (dưới `md`):
 * - `title`: đầu card (tên, email…). Mỗi bảng đúng một cột `title`.
 * - `field` (mặc định): một hàng "nhãn — giá trị" trong card, nhãn lấy từ `header`.
 * - `hidden`: không hiện trên card.
 * Cột chọn dòng nằm góc trái, cột thao tác góc phải card (DataTable tự xếp).
 */
export type DataTableMobileRole = "title" | "field" | "hidden";

/** Định nghĩa một cột dữ liệu của `DataTable`. */
export type DataTableColumn<T> = {
  id: string;
  /** Tiêu đề cột; cũng là nhãn trong card mobile và trong menu ẩn/hiện cột. */
  header: string;
  cell: (row: T) => ReactNode;
  /** Trường `ordering` của backend; có thì tiêu đề cột bấm được để sắp xếp. */
  sortKey?: string;
  /** Căn phải cho cột số. */
  align?: "start" | "end";
  mobile?: DataTableMobileRole;
  /** Ẩn cột ở bảng khi khung từ `md` tới dưới mốc này (cột phụ); card mobile vẫn hiện. */
  hideBelow?: "lg" | "xl";
  /** `false` = luôn hiện, không có trong menu ẩn/hiện cột (mặc định: cột `title` không ẩn được). */
  enableHiding?: boolean;
  /** `false` = không cho ghim cột (mặc định: ghim được). */
  enablePinning?: boolean;
  /** Có thể kéo đổi độ rộng trên bảng desktop (mặc định có). */
  enableResizing?: boolean;
  /** Giới hạn độ rộng khi resize, đơn vị pixel. */
  minWidth?: number;
  maxWidth?: number;
  /** Class thêm cho cả `<th>` và `<td>`. */
  className?: string;
};

/**
 * Thao tác riêng của một dòng, đặt trong cột Thao tác sau Xem / Sửa / Sao chép / Xoá
 * (ví dụ Thu hồi phiên — bảng không có Sửa/Xoá). Nút chỉ icon + tooltip.
 */
export type DataTableRowAction<T> = {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: (row: T) => unknown;
  /** Dòng không có thao tác này (ẩn nút). */
  hidden?: (row: T) => boolean;
  /** Tô đỏ khi rê (thao tác phá huỷ). */
  destructive?: boolean;
};

/** Quyền cho thao tác chuẩn của dòng: Sửa (`update`), Sao chép (`create`), Xoá (`delete`). Xem luôn được. */
export type DataTableActionPermissions = {
  update?: boolean;
  create?: boolean;
  delete?: boolean;
};

/** Thao tác hàng loạt tuỳ biến (ngoài Đổi trạng thái / Xoá dựng sẵn). */
export type DataTableBulkAction<T> = {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: (rows: T[]) => unknown;
  /** Thao tác phá huỷ (thu hồi…): nút đỏ. */
  destructive?: boolean;
  /** Có thì hỏi xác nhận trước khi chạy (nội dung theo các dòng đã chọn). */
  confirm?: (rows: T[]) => { title: string; description?: string; confirmLabel: string };
};

/** Đổi trạng thái hàng loạt: danh sách trạng thái + callback. */
export type DataTableBulkStatus<T> = {
  options: { value: string; label: string }[];
  onChange: (rows: T[], value: string) => unknown;
};

/** Props của `DataTable`. */
export type DataTableProps<T> = {
  /** Mã bảng, dùng làm khoá lưu cột đang ẩn trên trình duyệt. */
  tableId: string;
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  /** Tên hiển thị của dòng (dùng trong hộp xác nhận xoá). */
  getRowLabel: (row: T) => string;
  /** Lần tải đầu (chưa có dữ liệu): khung chờ. */
  isLoading?: boolean;
  /** Tải lại khi đã có dữ liệu cũ (đổi trang, từ khóa, sắp xếp): làm mờ bảng. */
  isFetching?: boolean;
  error?: { message?: string; onRetry: () => void } | null;
  /** Rỗng khi chưa có dữ liệu (rỗng do tìm kiếm `DataTable` tự lo). */
  empty?: { title?: ReactNode; description?: ReactNode; action?: ReactNode };
  search?: { value: string; onValueChange: (value: string) => void; placeholder: string };
  /** Sắp xếp hiện tại theo cú pháp `ordering` của backend (`email`, `-email`). */
  ordering?: string;
  onOrderingChange?: (ordering: string | undefined) => void;
  pagination?: {
    value: Pagination;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
  };
  onReload?: () => void;
  /** Control thêm trên toolbar, bên phải ô tìm. */
  toolbar?: ReactNode;
  /** Control lọc của module, đặt cùng khu vực tìm kiếm, tự xuống hàng khi thiếu chỗ. */
  filters?: ReactNode;
  /** Có bộ lọc đang áp dụng: hiện nút xóa và trạng thái rỗng do lọc. */
  onClearFilters?: () => void;
  /**
   * Cột Thao tác chuẩn, thứ tự cố định: Xem → Sửa → Sao chép → Xoá (xoá có xác nhận), rồi tới `rowActions`.
   * Tài nguyên có trang chi tiết thì **luôn** truyền đủ `onView`/`onEdit`/`onDelete`; thiếu quyền thì khai ở
   * `can` để nút hiện mờ (disabled + tooltip lý do), không truyền `undefined` để ẩn nút. Chỉ bỏ handler khi
   * nghiệp vụ không có thao tác đó (bảng ngoại lệ ở rule frontend §3.1). Thêm ở toolbar.
   * Bật/tắt trạng thái (khoá, kích hoạt…) đặt ở cột Trạng thái (`TableStatusSwitch`), không ở đây.
   */
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onCopy?: (row: T) => void;
  onDelete?: (row: T) => unknown;
  /** Quyền của người dùng cho thao tác chuẩn (mặc định có). `false` = nút mờ, tooltip "không có quyền". */
  can?: DataTableActionPermissions;
  /** Dòng không được sửa (nút Sửa mờ), ví dụ bản ghi hệ thống. */
  canEditRow?: (row: T) => boolean;
  /** Dòng không được xoá (nút Xoá mờ), ví dụ chính mình, bản ghi hệ thống. */
  canDeleteRow?: (row: T) => boolean;
  /** Thao tác riêng của dòng (Thu hồi…), sau các thao tác chuẩn trong cột Thao tác. */
  rowActions?: DataTableRowAction<T>[];
  /** Có bất kỳ thao tác hàng loạt nào thì hiện cột chọn dòng. */
  onBulkDelete?: (rows: T[]) => unknown;
  bulkStatus?: DataTableBulkStatus<T>;
  bulkActions?: DataTableBulkAction<T>[];
  /** Dòng không được chọn (ví dụ chính mình, bản ghi hệ thống). */
  canSelectRow?: (row: T) => boolean;
  /** Hiện cột `#` (mặc định có). */
  showIndex?: boolean;
  "aria-label"?: string;
};
