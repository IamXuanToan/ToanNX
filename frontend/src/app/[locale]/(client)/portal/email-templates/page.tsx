import { EmailTemplateListView } from "@/modules/system/views/email-template/email-template-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.emailTemplates.nav" });

/**
 * Trang danh sách mẫu email trong Client Portal.
 *
 * @returns EmailTemplateListView ở chế độ Portal.
 */
export default function PortalEmailTemplatesPage() {
  return <EmailTemplateListView routeContext="portal" />;
}
