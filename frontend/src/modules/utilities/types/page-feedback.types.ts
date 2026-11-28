/** Loại đối tượng nhận góp ý (`PAGE` | `SHORT_LINK`). */
export type PageFeedbackTargetType = "PAGE" | "SHORT_LINK";

/** Phân loại góp ý (`BROKEN_LINK` | `WRONG_INFO` | `BUG` | `SUGGESTION` | `OTHER`). */
export type PageFeedbackType = "BROKEN_LINK" | "WRONG_INFO" | "BUG" | "SUGGESTION" | "OTHER";

/** Trạng thái xử lý (`OPEN` | `IN_PROGRESS` | `RESOLVED` | `IGNORED`). */
export type PageFeedbackStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "IGNORED";

/** Thông tin người dùng gắn với góp ý. */
export type PageFeedbackUserSummary = {
  id: string;
  username?: string | null;
  fullName?: string | null;
  email: string;
};

/** Bản ghi góp ý trong danh sách (`GET /utilities/page-feedbacks`). */
export type PageFeedback = {
  id: string;
  targetType: PageFeedbackTargetType;
  pageId: string | null;
  shortLinkId: string | null;
  targetOwner: PageFeedbackUserSummary;
  targetUrl: string;
  targetTitle: string;
  targetItemId: string;
  feedbackType: PageFeedbackType;
  message: string;
  senderName: string;
  senderEmail: string;
  status: PageFeedbackStatus;
  thankedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết góp ý (`GET /utilities/page-feedbacks/{id}`). */
export type PageFeedbackDetail = PageFeedback & {
  resolutionNote: string;
  resolvedBy: PageFeedbackUserSummary | null;
  thankedBy: PageFeedbackUserSummary | null;
};

/** Phản hồi khi khách gửi góp ý công khai (`POST /utilities/public/feedbacks`). */
export type PageFeedbackPublicResult = {
  id: string;
  targetType: PageFeedbackTargetType;
  feedbackType: PageFeedbackType;
  status: PageFeedbackStatus;
  createdAt: string;
};

/** Kết quả sau khi gửi email cảm ơn (`POST /utilities/page-feedbacks/{id}/thank`). */
export type PageFeedbackThankResult = {
  sent: boolean;
  thankedAt: string;
  subject: string;
};

/** Dữ liệu gửi góp ý công khai. */
export type PageFeedbackPublicCreateInput = {
  targetType: PageFeedbackTargetType;
  targetId?: string;
  slug?: string;
  targetUrl: string;
  targetTitle?: string;
  targetItemId?: string;
  feedbackType: PageFeedbackType;
  message: string;
  senderName?: string;
  senderEmail?: string;
  website?: string;
};

/** Dữ liệu cập nhật trạng thái / ghi chú xử lý. */
export type PageFeedbackUpdateInput = {
  status?: PageFeedbackStatus;
  resolutionNote?: string;
};

/** Dữ liệu gửi lời cảm ơn. */
export type PageFeedbackThankInput = {
  templateId?: string;
  subject?: string;
  htmlBody?: string;
  resolutionNote?: string;
};

/** Tham số lọc danh sách góp ý. */
export type PageFeedbackFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  status?: string[];
  feedbackType?: string[];
  targetType?: string[];
  owner?: string[];
  thanked?: boolean;
};
