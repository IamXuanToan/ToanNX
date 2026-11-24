import { createPageMetadata } from "@/shares/lib/seo";
import { DEMO_TEMPLATE_TYPE } from "@/modules/utilities/constants/page-constants";
import { TemplateDemoView } from "@/modules/utilities/views/page/template-demo-view";

export const generateMetadata = createPageMetadata({
  title: "utilities.customPages.pages.viewLiveDemo",
  index: true,
});

/**
 * Trang xem trước trực tiếp các mẫu template công khai (/demo).
 * Mặc định hiển thị mẫu Tiếp thị liên kết (Affiliate Storefront), không redirect ngầm.
 *
 * @returns TemplateDemoView.
 */
export default function DemoIndexPage() {
  return <TemplateDemoView type={DEMO_TEMPLATE_TYPE.AFFILIATE} />;
}
