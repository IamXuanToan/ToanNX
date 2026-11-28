import { useQuery } from "@tanstack/react-query";

import { languageKeys } from "../constants/query-keys";
import { languageService } from "../services/language.service";
import type { LanguageFilters } from "../types/language.types";

/**
 * Truy vấn danh sách ngôn ngữ có phân trang và lọc.
 *
 * @param filters - Tham số lọc danh sách.
 * @param enabled - Bật/tắt truy vấn theo quyền.
 * @returns Kết quả truy vấn React Query.
 */
export function useLanguages(filters: LanguageFilters = {}, enabled = true) {
  return useQuery({
    queryKey: languageKeys.list(filters),
    queryFn: ({ signal }) => languageService.list(filters, signal),
    enabled,
  });
}
