import { PageListView } from "@/modules/custom-pages/views/page-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "customPages.nav.pages" });

/** Trang danh sách trang công khai. */
export default function CustomPagesPage() {
  return <PageListView />;
}
