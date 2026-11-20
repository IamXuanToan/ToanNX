import { PagePathCreateView } from "@/modules/utilities/views/page-path-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.customPages.paths.create" });

/** Trang tạo đường dẫn giữa. */
export default function PagePathCreatePage() {
  return <PagePathCreateView />;
}
