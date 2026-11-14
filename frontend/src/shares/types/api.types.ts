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
