import { useQuery } from "@tanstack/react-query";

import { pageFeedbackKeys } from "../constants/query-keys";
import { pageFeedbackService } from "../services/page-feedback.service";

/**
 * Truy vấn chi tiết một góp ý theo ID.
 *
 * @param id - ID góp ý.
 * @param enabled - Bật/tắt truy vấn.
 * @returns Kết quả truy vấn React Query.
 */
export function usePageFeedback(id: string, enabled = true) {
  return useQuery({
    queryKey: pageFeedbackKeys.detail(id),
    queryFn: ({ signal }) => pageFeedbackService.get(id, signal),
    enabled: Boolean(id) && enabled,
  });
}
