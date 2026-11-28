import { useQuery } from "@tanstack/react-query";

import { languageKeys } from "../constants/query-keys";
import { languageService } from "../services/language.service";

/**
 * Truy vấn danh sách ngôn ngữ đang bật (endpoint công khai `/system/languages/active`).
 *
 * @returns Kết quả truy vấn React Query.
 */
export function useActiveLanguages() {
  return useQuery({
    queryKey: languageKeys.active(),
    queryFn: ({ signal }) => languageService.listActive(signal),
    staleTime: 60_000,
  });
}
