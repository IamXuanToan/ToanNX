import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";
import { PageFeedbackDetailView } from "@/modules/utilities/views/page-feedback/page-feedback-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.feedbacks.detailTitle" });

/**
 * Trang chi tiết góp ý / báo lỗi ẩn danh (Quản trị) kèm tab lịch sử thay đổi.
 *
 * @param props - Tham số route chứa `id`.
 * @returns PageFeedbackDetailView.
 */
export default async function AdminFeedbackDetailPage({
  params,
}: PageProps<"/[locale]/admin/feedbacks/[id]">) {
  const { id } = await params;
  return (
    <PageFeedbackDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${UTILITIES_API_ENDPOINTS.pageFeedbacks}/${id}/history`}
          fieldPrefix="utilities.feedbacks.fields"
        />
      }
    />
  );
}
