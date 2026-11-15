import { PagePathListView } from "@/modules/custom-pages/views/page-path-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "customPages.nav.paths" });

/** Trang danh sách đường dẫn giữa. */
export default function PagePathsPage() {
  return <PagePathListView />;
}
