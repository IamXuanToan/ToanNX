import { useMutation, useQueryClient } from "@tanstack/react-query";

import { pageFeedbackKeys } from "../constants/query-keys";
import { pageFeedbackService } from "../services/page-feedback.service";
import type { PageFeedbackThankInput } from "../types/page-feedback.types";

/**
 * Gửi email cảm ơn tới người đã góp ý và đánh dấu đã xử lý xong.
 *
 * @returns Mutation gửi lời cảm ơn.
 */
export function useThankPageFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PageFeedbackThankInput }) =>
      pageFeedbackService.thank(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: pageFeedbackKeys.all });
      queryClient.invalidateQueries({ queryKey: pageFeedbackKeys.detail(id) });
    },
  });
}
