import { useMutation, useQueryClient } from "@tanstack/react-query";

import { emailTemplateKeys } from "../constants/query-keys";
import { emailTemplateService } from "../services/email-template.service";
import type { EmailTemplateCreateInput } from "../types/email-template.types";

/**
 * Tạo mới một mẫu email.
 *
 * @returns Mutation tạo mẫu email.
 */
export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmailTemplateCreateInput) => emailTemplateService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
    },
  });
}
