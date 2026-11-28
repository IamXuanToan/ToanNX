import { useQuery } from "@tanstack/react-query";

import { emailTemplateKeys } from "../constants/query-keys";
import { emailTemplateService } from "../services/email-template.service";
import type { EmailTemplateFilters } from "../types/email-template.types";

/**
 * Truy vấn danh sách mẫu email có phân trang và lọc.
 *
 * @param filters - Tham số lọc danh sách.
 * @param enabled - Bật/tắt truy vấn theo quyền.
 * @returns Kết quả truy vấn React Query.
 */
export function useEmailTemplates(filters: EmailTemplateFilters = {}, enabled = true) {
  return useQuery({
    queryKey: emailTemplateKeys.list(filters),
    queryFn: ({ signal }) => emailTemplateService.list(filters, signal),
    enabled,
  });
}
