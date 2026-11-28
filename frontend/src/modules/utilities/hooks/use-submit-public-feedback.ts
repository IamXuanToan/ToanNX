import { useMutation } from "@tanstack/react-query";

import { pageFeedbackService } from "../services/page-feedback.service";
import type { PageFeedbackPublicCreateInput } from "../types/page-feedback.types";

/**
 * Gửi góp ý ẩn danh từ khách vãng lai trên Custom Page hoặc ShortLink.
 *
 * @returns Mutation gửi góp ý công khai.
 */
export function useSubmitPublicFeedback() {
  return useMutation({
    mutationFn: (input: PageFeedbackPublicCreateInput) => pageFeedbackService.submitPublic(input),
  });
}
