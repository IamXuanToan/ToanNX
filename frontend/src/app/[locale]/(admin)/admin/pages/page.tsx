import { PageListView } from "@/modules/utilities/views/page-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.pages" });

/** Trang danh sách trang công khai. */
export default function CustomPagesPage() {
  return <PageListView />;
}
