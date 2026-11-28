import { useMutation, useQueryClient } from "@tanstack/react-query";

import { pageFeedbackKeys } from "../constants/query-keys";
import { pageFeedbackService } from "../services/page-feedback.service";

/**
 * Xóa mềm một bản ghi góp ý.
 *
 * @returns Mutation xóa góp ý.
 */
export function useDeletePageFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pageFeedbackService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageFeedbackKeys.all });
    },
  });
}
