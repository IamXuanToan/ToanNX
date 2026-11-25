import { SepayView } from "@/modules/finance/views/sepay-connection/sepay-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.sepay" });

/** Kết nối SePay cá nhân. */
export default function Page() {
  return <SepayView />;
}
