/** Phạm vi mẫu email (`SYSTEM` | `PERSONAL`). */
export type EmailTemplateScope = "SYSTEM" | "PERSONAL";

/** Nhóm nghiệp vụ mẫu email. */
export type EmailTemplateCategory = "AUTH" | "NOTIFICATION" | "FEEDBACK_THANKS" | "CUSTOM";

/** Trạng thái mẫu email (`ACTIVE` | `DRAFT` | `ARCHIVED`). */
export type EmailTemplateStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

/** Thông tin chủ sở hữu mẫu email. */
export type EmailTemplateOwner = {
  id: string;
  username?: string | null;
  fullName?: string | null;
  email: string;
};

/** Nội dung của một ngôn ngữ trong mẫu email. */
export type EmailTemplateTranslationItem = {
  name: string;
  subject: string;
  content: Record<string, unknown>;
  htmlBody: string;
};

/** Mẫu email trong danh sách (`GET /system/email-templates`). */
export type EmailTemplate = {
  id: string;
  code: string;
  name: string;
  description: string;
  locale: string;
  availableLocales: string[];
  scope: EmailTemplateScope;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  owner: EmailTemplateOwner | null;
  subject: string;
  variables: string[];
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Chi tiết mẫu email (`GET /system/email-templates/{id}`). */
export type EmailTemplateDetail = EmailTemplate & {
  content: Record<string, unknown>;
  htmlBody: string;
  translations: Record<string, EmailTemplateTranslationItem>;
};

/** Dữ liệu tạo mẫu email. */
export type EmailTemplateCreateInput = {
  code: string;
  name?: string;
  description?: string;
  locale?: string;
  scope?: EmailTemplateScope;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  subject?: string;
  content?: Record<string, unknown>;
  htmlBody?: string;
  translations?: Record<string, EmailTemplateTranslationItem>;
  variables?: string[];
};

/** Dữ liệu cập nhật mẫu email. */
export type EmailTemplateUpdateInput = Partial<Omit<EmailTemplateCreateInput, "code" | "scope">>;

/** Dữ liệu kết quả xem trước sau trộn biến. */
export type EmailTemplatePreviewResult = {
  subject: string;
  htmlBody: string;
  textBody: string;
};

/** Tham số lọc danh sách mẫu email. */
export type EmailTemplateFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  scope?: string[];
  category?: string[];
  status?: string[];
  locale?: string[];
  owner?: string[];
  portalOnly?: boolean;
};
