import { SepayView } from "@/modules/finance/views/sepay-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.sepay" });

/** Kết nối SePay. */
export default function Page() {
  return <SepayView />;
}
