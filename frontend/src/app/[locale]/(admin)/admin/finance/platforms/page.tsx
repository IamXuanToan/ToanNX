import { PlatformListView } from "@/modules/finance/views/platform-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.platforms" });

/** Danh sách platforms. */
export default function Page() {
  return <PlatformListView />;
}
