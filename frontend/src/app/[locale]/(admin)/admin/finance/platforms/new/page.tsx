import { PlatformCreateView } from "@/modules/finance/views/platform/platform-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.platforms" });

/** Tạo platforms. */
export default function Page() {
  return <PlatformCreateView />;
}
