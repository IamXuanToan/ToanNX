/** Giới hạn độ dài và số từ tìm kiếm bảng khớp `CoreSearchFilter` ở backend. */
export const SEARCH_MAX_LENGTH = 100;
export const SEARCH_MAX_TERMS = 5;

/**
 * Chuẩn hoá chuỗi để tìm kiếm không phân biệt hoa thường và dấu tiếng Việt ("nguoi" khớp "Người").
 *
 * @param value - Chuỗi gốc.
 * @returns Chuỗi đã bỏ dấu, viết thường.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Tách từ khóa giống `SearchFilter` của DRF (tách theo dấu phẩy và khoảng trắng).
 *
 * @param value - Từ khóa tìm kiếm.
 * @returns Danh sách từ khóa đã tách.
 */
export function splitSearchTerms(value: string): string[] {
  return value.replaceAll(",", " ").trim().split(/\s+/).filter(Boolean);
}

/**
 * Kiểm tra từ khóa có vượt giới hạn của backend (`100` ký tự / `5` từ) không.
 *
 * @param value - Từ khóa cần kiểm.
 * @returns `true` nếu vượt giới hạn.
 */
export function isSearchQueryTooLong(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > SEARCH_MAX_LENGTH || splitSearchTerms(trimmed).length > SEARCH_MAX_TERMS;
}

/**
 * Cắt gọn từ khóa từ URL về giới hạn hợp lệ của backend để tránh lỗi `400 VALIDATION_ERROR`.
 *
 * @param value - Từ khóa gốc đọc từ query string.
 * @returns Từ khóa trong giới hạn cho phép.
 */
export function clampSearchQuery(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const limitedTerms = splitSearchTerms(trimmed).slice(0, SEARCH_MAX_TERMS);
  let result = "";
  for (const term of limitedTerms) {
    const candidate = result ? `${result} ${term}` : term;
    if (candidate.length > SEARCH_MAX_LENGTH) {
      return result || trimmed.slice(0, SEARCH_MAX_LENGTH).trim();
    }
    result = candidate;
  }
  return result;
}

/**
 * Lọc lựa chọn theo từ khóa (khớp nhãn hoặc mô tả, bỏ dấu).
 *
 * @param options - Danh sách lựa chọn.
 * @param keyword - Từ khóa.
 * @returns Lựa chọn khớp.
 */
export function filterOptionsByKeyword<T extends { label: string; description?: string }>(
  options: T[],
  keyword: string,
): T[] {
  const needle = normalizeSearchText(keyword.trim());
  if (!needle) return options;
  return options.filter((option) =>
    normalizeSearchText(`${option.label} ${option.description ?? ""}`).includes(needle),
  );
}
