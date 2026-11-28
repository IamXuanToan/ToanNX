import { useMutation, useQueryClient } from "@tanstack/react-query";

import { emailTemplateKeys } from "../constants/query-keys";
import { emailTemplateService } from "../services/email-template.service";
import type { EmailTemplateUpdateInput } from "../types/email-template.types";

/**
 * Cập nhật thông tin hoặc nội dung mẫu email.
 *
 * @returns Mutation cập nhật mẫu email.
 */
export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EmailTemplateUpdateInput }) =>
      emailTemplateService.update(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.detail(id) });
    },
  });
}
