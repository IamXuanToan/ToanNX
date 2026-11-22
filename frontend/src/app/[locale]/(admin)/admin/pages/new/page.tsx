import { PageCreateView } from "@/modules/utilities/views/page/page-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.customPages.pages.create" });

/** Trang tạo trang công khai. */
export default function CustomPageCreatePage() {
  return <PageCreateView />;
}
