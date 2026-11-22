import { InvoiceCreateView } from "@/modules/finance/views/invoice-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.invoices" });

/** Tạo invoices. */
export default function Page() {
  return <InvoiceCreateView />;
}
