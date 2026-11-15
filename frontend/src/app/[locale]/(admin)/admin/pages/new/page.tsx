import { PageCreateView } from "@/modules/custom-pages/views/page-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "customPages.pages.create" });

/** Trang tạo trang công khai. */
export default function CustomPageCreatePage() {
  return <PageCreateView />;
}
