import { PageFeedbackListView } from "@/modules/utilities/views/page-feedback/page-feedback-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.feedbacks" });

/**
 * Trang danh sách góp ý / báo lỗi cho trang & link của người dùng trong Client Portal.
 *
 * @returns PageFeedbackListView ở chế độ Portal.
 */
export default function PortalFeedbacksPage() {
  return <PageFeedbackListView routeContext="portal" />;
}
