import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { SHORT_LINKS_API_ENDPOINTS } from "@/modules/short-links/constants/api-endpoints";
import { ShortLinkDetailView } from "@/modules/short-links/views/short-link-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "shortLinks.nav.links" });

/**
 * Trang chi tiết link rút gọn (Short Links) + lịch sử thay đổi (Journal) qua slot `history`.
 *
 * @param props - Tham số route.
 * @returns ShortLinkDetailView.
 */
export default async function ShortLinkDetailPage({
  params,
}: PageProps<"/[locale]/admin/short-links/[id]">) {
  const { id } = await params;
  return (
    <ShortLinkDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${SHORT_LINKS_API_ENDPOINTS.links}/${id}/history`}
          fieldPrefix="shortLinks.fields"
        />
      }
    />
  );
}
