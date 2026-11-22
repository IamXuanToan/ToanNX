import { ShortLinkListView } from "@/modules/utilities/views/short-link/short-link-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.shortLinks" });

/** Trang danh sách link rút gọn. */
export default function ShortLinksPage() {
  return <ShortLinkListView />;
}
