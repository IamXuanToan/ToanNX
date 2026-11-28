import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { UTILITIES_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  PageFeedback,
  PageFeedbackDetail,
  PageFeedbackFilters,
  PageFeedbackPublicCreateInput,
  PageFeedbackPublicResult,
  PageFeedbackStatus,
  PageFeedbackThankInput,
  PageFeedbackThankResult,
  PageFeedbackUpdateInput,
} from "../types/page-feedback.types";

const crud = createCrudService<
  PageFeedback,
  PageFeedbackFilters,
  never,
  PageFeedbackUpdateInput,
  PageFeedbackDetail
>(UTILITIES_API_ENDPOINTS.pageFeedbacks);

/** Service góp ý / báo lỗi ẩn danh trên Custom Page & ShortLink. */
export const pageFeedbackService = {
  ...crud,

  /**
   * Khách vãng lai gửi góp ý ẩn danh từ trang công khai hoặc màn hình đếm ngược ShortLink.
   *
   * @param input - Thông tin góp ý (kèm trường honeypot `website` luôn rỗng).
   * @returns Kết quả ghi nhận góp ý.
   */
  async submitPublic(input: PageFeedbackPublicCreateInput): Promise<PageFeedbackPublicResult> {
    const response = await apiClient.post<PageFeedbackPublicResult>(
      UTILITIES_API_ENDPOINTS.publicFeedbacks,
      input,
    );
    return response.data;
  },

  /**
   * Gửi email cảm ơn tới người đã góp ý và đánh dấu đã xử lý xong.
   *
   * @param id - ID góp ý.
   * @param input - ID mẫu email tùy chọn hoặc tiêu đề/nội dung chỉnh sửa.
   * @returns Trạng thái gửi email cảm ơn.
   */
  async thank(id: string, input: PageFeedbackThankInput): Promise<PageFeedbackThankResult> {
    const response = await apiClient.post<PageFeedbackThankResult>(
      UTILITIES_API_ENDPOINTS.pageFeedbackThank(id),
      input,
    );
    return response.data;
  },

  /**
   * Cập nhật trạng thái hàng loạt (`OPEN` / `IN_PROGRESS` / `RESOLVED` / `IGNORED`).
   *
   * @param ids - Danh sách ID góp ý.
   * @param status - Trạng thái mới.
   */
  async bulkUpdateStatus(ids: readonly string[], status: PageFeedbackStatus): Promise<void> {
    await crud.bulkUpdate([...ids], { status });
  },
};
