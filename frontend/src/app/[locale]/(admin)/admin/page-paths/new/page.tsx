import { PagePathCreateView } from "@/modules/custom-pages/views/page-path-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "customPages.paths.create" });

/** Trang tạo đường dẫn giữa. */
export default function PagePathCreatePage() {
  return <PagePathCreateView />;
}
