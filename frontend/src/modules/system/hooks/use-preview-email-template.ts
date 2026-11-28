import { useMutation } from "@tanstack/react-query";

import { emailTemplateService } from "../services/email-template.service";

/**
 * Xem trước mẫu email sau khi trộn dữ liệu giả lập theo ngôn ngữ.
 *
 * @returns Mutation xem trước mẫu email.
 */
export function usePreviewEmailTemplate() {
  return useMutation({
    mutationFn: ({
      id,
      sampleData,
      locale = "vi",
    }: {
      id: string;
      sampleData: Record<string, unknown>;
      locale?: string;
    }) => emailTemplateService.preview(id, sampleData, locale),
  });
}
