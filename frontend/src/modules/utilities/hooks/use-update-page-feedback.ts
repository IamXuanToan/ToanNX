import { useMutation, useQueryClient } from "@tanstack/react-query";

import { pageFeedbackKeys } from "../constants/query-keys";
import { pageFeedbackService } from "../services/page-feedback.service";
import type { PageFeedbackUpdateInput } from "../types/page-feedback.types";

/**
 * Cập nhật trạng thái hoặc ghi chú xử lý cho một góp ý.
 *
 * @returns Mutation cập nhật góp ý.
 */
export function useUpdatePageFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PageFeedbackUpdateInput }) =>
      pageFeedbackService.update(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: pageFeedbackKeys.all });
      queryClient.invalidateQueries({ queryKey: pageFeedbackKeys.detail(id) });
    },
  });
}
