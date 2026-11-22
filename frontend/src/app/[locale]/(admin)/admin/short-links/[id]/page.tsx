import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";
import { ShortLinkDetailView } from "@/modules/utilities/views/short-link/short-link-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.shortLinks" });

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
          path={`${UTILITIES_API_ENDPOINTS.shortLinks}/${id}/history`}
          fieldPrefix="utilities.shortLinks.fields"
        />
      }
    />
  );
}
