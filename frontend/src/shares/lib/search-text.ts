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
