import { EmailTemplateCreateView } from "@/modules/system/views/email-template/email-template-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.emailTemplates.createTitle" });

/**
 * Trang tạo mới mẫu email cá nhân trong Client Portal.
 *
 * @returns EmailTemplateCreateView ở chế độ Portal.
 */
export default function PortalEmailTemplateCreatePage() {
  return <EmailTemplateCreateView routeContext="portal" />;
}
