import { PageFeedbackListView } from "@/modules/utilities/views/page-feedback/page-feedback-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.feedbacks" });

/**
 * Trang danh sách góp ý / báo lỗi ẩn danh (Quản trị).
 *
 * @returns PageFeedbackListView.
 */
export default function AdminFeedbacksPage() {
  return <PageFeedbackListView />;
}
