import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";
import { PagePathDetailView } from "@/modules/utilities/views/page-path-detail-view";
import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.pagePaths" });

/**
 * Trang chi tiết đường dẫn giữa + lịch sử thay đổi (Journal) qua slot `history`.
 *
 * @param props - Tham số route.
 * @returns PagePathDetailView.
 */
export default async function PagePathDetailPage({
  params,
}: PageProps<"/[locale]/admin/page-paths/[id]">) {
  const { id } = await params;
  return (
    <PagePathDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${UTILITIES_API_ENDPOINTS.pagePaths}/${id}/history`}
          fieldPrefix="utilities.customPages.paths.fields"
        />
      }
    />
  );
}
