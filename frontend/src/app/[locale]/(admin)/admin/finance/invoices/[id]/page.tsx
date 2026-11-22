import { FINANCE_API_ENDPOINTS } from "@/modules/finance/constants/api-endpoints";
import { InvoiceDetailView } from "@/modules/finance/views/invoice-detail-view";
import { RecordHistoryView } from "@/modules/system/views/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.invoices" });

/** Chi tiết invoices. */
export default async function Page({ params }: PageProps<"/[locale]/admin/finance/invoices/[id]">) {
  const { id } = await params;
  return (
    <InvoiceDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${FINANCE_API_ENDPOINTS.invoices}/${id}/history`}
          fieldPrefix="finance.history.fields"
        />
      }
    />
  );
}
