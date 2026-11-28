import { useMutation, useQueryClient } from "@tanstack/react-query";

import { emailTemplateKeys } from "../constants/query-keys";
import { emailTemplateService } from "../services/email-template.service";

/**
 * Nhân bản mẫu email thành bản `PERSONAL` riêng của người dùng hiện tại.
 *
 * @returns Mutation nhân bản mẫu email.
 */
export function useDuplicateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailTemplateService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
    },
  });
}
