import { InvoiceListView } from "@/modules/finance/views/invoice/invoice-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.invoices" });

/** Danh sách hóa đơn cá nhân. */
export default function Page() {
  return <InvoiceListView />;
}
