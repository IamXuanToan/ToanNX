import { PlatformListView } from "@/modules/finance/views/platform/platform-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.platforms" });

/** Danh sách nền tảng cá nhân. */
export default function Page() {
  return <PlatformListView />;
}
