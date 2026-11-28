import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  EmailTemplate,
  EmailTemplateCreateInput,
  EmailTemplateDetail,
  EmailTemplateFilters,
  EmailTemplatePreviewResult,
  EmailTemplateStatus,
  EmailTemplateUpdateInput,
} from "../types/email-template.types";

const crud = createCrudService<
  EmailTemplate,
  EmailTemplateFilters,
  EmailTemplateCreateInput,
  EmailTemplateUpdateInput,
  EmailTemplateDetail
>(SYSTEM_API_ENDPOINTS.emailTemplates);

/** Service quản lý mẫu email (`EmailTemplate`). */
export const emailTemplateService = {
  ...crud,

  /**
   * Nhân bản một mẫu `SYSTEM` hoặc `PERSONAL` thành bản `PERSONAL` của người dùng hiện tại.
   *
   * @param id - ID mẫu nguồn.
   * @returns Bản sao `EmailTemplateDetail`.
   */
  async duplicate(id: string): Promise<EmailTemplateDetail> {
    const response = await apiClient.post<EmailTemplateDetail>(
      SYSTEM_API_ENDPOINTS.emailTemplateDuplicate(id),
    );
    return response.data;
  },

  /**
   * Xem trước mẫu email sau khi trộn biến mẫu.
   *
   * @param id - ID mẫu email.
   * @param sampleData - Giá trị biến giả lập.
   * @returns Tiêu đề, HTML và text sau trộn.
   */
  async preview(
    id: string,
    sampleData: Record<string, unknown>,
    locale = "vi",
  ): Promise<EmailTemplatePreviewResult> {
    const response = await apiClient.post<EmailTemplatePreviewResult>(
      SYSTEM_API_ENDPOINTS.emailTemplatePreview(id),
      { sampleData, locale },
    );
    return response.data;
  },

  /**
   * Đổi trạng thái hàng loạt (`ACTIVE` / `DRAFT` / `ARCHIVED`).
   *
   * @param ids - Danh sách ID mẫu.
   * @param status - Trạng thái mới.
   */
  async bulkUpdateStatus(ids: readonly string[], status: EmailTemplateStatus): Promise<void> {
    await crud.bulkUpdate([...ids], { status });
  },
};
