import { useMutation, useQueryClient } from "@tanstack/react-query";

import { emailTemplateKeys } from "../constants/query-keys";
import { emailTemplateService } from "../services/email-template.service";

/**
 * Xóa mềm mẫu email (không cho xóa mẫu hệ thống mặc định).
 *
 * @returns Mutation xóa mẫu email.
 */
export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailTemplateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.all });
    },
  });
}
