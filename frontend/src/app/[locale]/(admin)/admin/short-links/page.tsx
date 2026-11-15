import { ShortLinkListView } from "@/modules/short-links/views/short-link-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "shortLinks.nav.links" });

/** Trang danh sách link rút gọn. */
export default function ShortLinksPage() {
  return <ShortLinkListView />;
}
