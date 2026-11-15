import { CUSTOM_PAGES_API_ENDPOINTS } from "@/modules/custom-pages/constants/api-endpoints";
import { PagePathDetailView } from "@/modules/custom-pages/views/page-path-detail-view";
import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "customPages.nav.paths" });

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
          path={`${CUSTOM_PAGES_API_ENDPOINTS.paths}/${id}/history`}
          fieldPrefix="customPages.paths.fields"
        />
      }
    />
  );
}
