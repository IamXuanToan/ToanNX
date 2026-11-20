import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";
import { PageDetailView } from "@/modules/utilities/views/page-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.pages" });

/**
 * Trang soạn trang tùy chỉnh (module Tiện ích) + lịch sử thay đổi (Journal) qua slot `history`.
 *
 * @param props - Tham số route.
 * @returns PageDetailView.
 */
export default async function CustomPageDetailPage({
  params,
}: PageProps<"/[locale]/admin/pages/[id]">) {
  const { id } = await params;
  return (
    <PageDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${UTILITIES_API_ENDPOINTS.pages}/${id}/history`}
          fieldPrefix="utilities.customPages.pages.fields"
        />
      }
    />
  );
}
