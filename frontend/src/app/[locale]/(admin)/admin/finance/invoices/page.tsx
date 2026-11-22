import { InvoiceListView } from "@/modules/finance/views/invoice-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.invoices" });

/** Danh sách invoices. */
export default function Page() {
  return <InvoiceListView />;
}
