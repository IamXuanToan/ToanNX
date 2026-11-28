import { useQuery } from "@tanstack/react-query";

import { emailTemplateKeys } from "../constants/query-keys";
import { emailTemplateService } from "../services/email-template.service";

/**
 * Truy vấn chi tiết một mẫu email theo ID.
 *
 * @param id - ID mẫu email.
 * @param enabled - Bật/tắt truy vấn.
 * @returns Kết quả truy vấn React Query.
 */
export function useEmailTemplate(id: string, enabled = true) {
  return useQuery({
    queryKey: emailTemplateKeys.detail(id),
    queryFn: ({ signal }) => emailTemplateService.get(id, signal),
    enabled: Boolean(id) && enabled,
  });
}
