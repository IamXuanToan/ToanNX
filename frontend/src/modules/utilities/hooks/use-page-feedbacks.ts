import { useQuery } from "@tanstack/react-query";

import { pageFeedbackKeys } from "../constants/query-keys";
import { pageFeedbackService } from "../services/page-feedback.service";
import type { PageFeedbackFilters } from "../types/page-feedback.types";

/**
 * Truy vấn danh sách góp ý / báo lỗi ẩn danh có phân trang và lọc.
 *
 * @param filters - Tham số lọc danh sách.
 * @param enabled - Bật/tắt truy vấn theo quyền.
 * @returns Kết quả truy vấn React Query.
 */
export function usePageFeedbacks(filters: PageFeedbackFilters = {}, enabled = true) {
  return useQuery({
    queryKey: pageFeedbackKeys.list(filters),
    queryFn: ({ signal }) => pageFeedbackService.list(filters, signal),
    enabled,
  });
}
