/** Thông tin phân trang từ backend (đã chuyển camelCase). */
export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Meta chuẩn của response thành công. */
export type ApiMeta = {
  requestId: string | null;
  timestamp: string;
  pagination?: Pagination;
};

/** Kết quả một request thành công. */
export type ApiResult<T> = {
  data: T;
  meta: ApiMeta;
};

/** Danh sách có phân trang. */
export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};

/**
 * Tham số danh sách chuẩn của mọi ViewSet (BE `CoreModelViewSet`).
 * Có `page`/`pageSize` thì BE phân trang; không có thì BE trả **toàn bộ** (danh mục, ô chọn).
 */
export type ListParams = {
  search?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
};

/** Một mục lịch sử thay đổi (BE `CoreJournalEntryResponseSerializer`). */
export type HistoryEntry = {
  id: string;
  createdAt: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "EVENT";
  /** Mã sự kiện khi `action = EVENT` (ví dụ `iam.role_assigned`). */
  event: string;
  /** `<module>.<model>`. */
  resource: string;
  objectId: string;
  objectLabel: string;
  actorId: string | null;
  actorLabel: string;
  /** `{field: [cũ, mới]}`; field ẩn là `***`. Khóa giữ nguyên tên field của BE. */
  changes: Record<string, [unknown, unknown]>;
};
