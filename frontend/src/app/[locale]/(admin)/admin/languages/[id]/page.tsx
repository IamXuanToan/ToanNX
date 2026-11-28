import { SYSTEM_API_ENDPOINTS } from "@/modules/system/constants/api-endpoints";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { LanguageDetailView } from "@/modules/system/views/language/language-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.languages.detailTitle" });

/**
 * Trang chi tiết Ngôn ngữ (Quản trị) kèm tab lịch sử thay đổi.
 *
 * @param props - Tham số route chứa `id`.
 * @returns LanguageDetailView.
 */
export default async function AdminLanguageDetailPage({
  params,
}: PageProps<"/[locale]/admin/languages/[id]">) {
  const { id } = await params;
  return (
    <LanguageDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${SYSTEM_API_ENDPOINTS.languages}/${id}/history`}
          fieldPrefix="system.languages.fields"
        />
      }
    />
  );
}
