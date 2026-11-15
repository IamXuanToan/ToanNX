import { ShortLinkCreateView } from "@/modules/short-links/views/short-link-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "shortLinks.create" });

/** Trang tạo link rút gọn. */
export default function ShortLinkCreatePage() {
  return <ShortLinkCreateView />;
}
