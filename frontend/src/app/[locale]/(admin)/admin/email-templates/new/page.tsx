import { EmailTemplateCreateView } from "@/modules/system/views/email-template/email-template-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.emailTemplates.createTitle" });

/**
 * Trang tạo mới mẫu email (Quản trị).
 *
 * @returns EmailTemplateCreateView.
 */
export default function AdminEmailTemplateCreatePage() {
  return <EmailTemplateCreateView />;
}
