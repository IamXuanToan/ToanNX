import { FINANCE_API_ENDPOINTS } from "@/modules/finance/constants/api-endpoints";
import { InvoiceDetailView } from "@/modules/finance/views/invoice/invoice-detail-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.invoices" });

/** Chi tiết hóa đơn cá nhân. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
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
