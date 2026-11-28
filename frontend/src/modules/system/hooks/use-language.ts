import { useQuery } from "@tanstack/react-query";

import { languageKeys } from "../constants/query-keys";
import { languageService } from "../services/language.service";

/**
 * Truy vấn chi tiết một ngôn ngữ theo ID.
 *
 * @param id - ID ngôn ngữ.
 * @param enabled - Bật/tắt truy vấn.
 * @returns Kết quả truy vấn React Query.
 */
export function useLanguage(id: string, enabled = true) {
  return useQuery({
    queryKey: languageKeys.detail(id),
    queryFn: ({ signal }) => languageService.get(id, signal),
    enabled: Boolean(id) && enabled,
  });
}
