import { z } from "zod";

/** Thông báo lỗi i18n cho form góp ý công khai. */
export type PublicFeedbackValidationMessages = {
  messageMin: string;
  messageMax: string;
  emailInvalid: string;
};

/** Tạo schema kiểm tra form góp ý công khai với thông báo lỗi theo ngôn ngữ hiện tại. */
export function createPublicFeedbackFormSchema(messages?: PublicFeedbackValidationMessages) {
  return z.object({
    feedbackType: z.enum(["BROKEN_LINK", "WRONG_INFO", "BUG", "SUGGESTION", "OTHER"]),
    message: z.string().trim().min(5, messages?.messageMin).max(2000, messages?.messageMax),
    senderName: z.string().trim().max(100).optional(),
    senderEmail: z
      .union([z.string().trim().email(messages?.emailInvalid), z.literal("")])
      .optional(),
    website: z.string().max(0).optional(),
  });
}

/** Schema kiểm tra dữ liệu form góp ý ẩn danh công khai (mặc định). */
export const publicFeedbackFormSchema = createPublicFeedbackFormSchema();

/** Kiểu dữ liệu form góp ý công khai. */
export type PublicFeedbackFormValues = z.infer<typeof publicFeedbackFormSchema>;

/** Schema kiểm tra dữ liệu form xử lý góp ý. */
export const pageFeedbackUpdateFormSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "IGNORED"]),
  resolutionNote: z.string().max(2000).optional(),
});

/** Kiểu dữ liệu form cập nhật góp ý. */
export type PageFeedbackUpdateFormValues = z.infer<typeof pageFeedbackUpdateFormSchema>;
