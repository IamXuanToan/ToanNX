import { PagePathListView } from "@/modules/utilities/views/page-path-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.pagePaths" });

/** Trang danh sách đường dẫn giữa. */
export default function PagePathsPage() {
  return <PagePathListView />;
}
