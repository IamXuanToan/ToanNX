import { EmailTemplateListView } from "@/modules/system/views/email-template/email-template-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.emailTemplates.nav" });

/**
 * Trang danh sách mẫu email (Quản trị).
 *
 * @returns EmailTemplateListView.
 */
export default function AdminEmailTemplatesPage() {
  return <EmailTemplateListView />;
}
