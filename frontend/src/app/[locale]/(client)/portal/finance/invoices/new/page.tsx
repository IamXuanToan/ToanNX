import { InvoiceCreateView } from "@/modules/finance/views/invoice/invoice-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.invoices" });

/** Tạo mới hóa đơn cá nhân. */
export default function Page() {
  return <InvoiceCreateView />;
}
