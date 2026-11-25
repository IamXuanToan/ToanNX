import { PlatformCreateView } from "@/modules/finance/views/platform/platform-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.platforms" });

/** Tạo mới nền tảng cá nhân. */
export default function Page() {
  return <PlatformCreateView />;
}
