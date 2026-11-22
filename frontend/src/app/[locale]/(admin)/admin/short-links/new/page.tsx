import { ShortLinkCreateView } from "@/modules/utilities/views/short-link/short-link-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.shortLinks.create" });

/** Trang tạo link rút gọn. */
export default function ShortLinkCreatePage() {
  return <ShortLinkCreateView />;
}
