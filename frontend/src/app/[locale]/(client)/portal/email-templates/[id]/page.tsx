import { SYSTEM_API_ENDPOINTS } from "@/modules/system/constants/api-endpoints";
import { EmailTemplateDetailView } from "@/modules/system/views/email-template/email-template-detail-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.emailTemplates.detailTitle" });

/**
 * Trang chi tiết mẫu email trong Client Portal kèm tab lịch sử thay đổi.
 *
 * @param props - Tham số route chứa `id`.
 * @returns EmailTemplateDetailView ở chế độ Portal.
 */
export default async function PortalEmailTemplateDetailPage({
  params,
}: PageProps<"/[locale]/portal/email-templates/[id]">) {
  const { id } = await params;
  return (
    <EmailTemplateDetailView
      id={id}
      routeContext="portal"
      history={
        <RecordHistoryView
          path={`${SYSTEM_API_ENDPOINTS.emailTemplates}/${id}/history`}
          fieldPrefix="system.emailTemplates.fields"
        />
      }
    />
  );
}
