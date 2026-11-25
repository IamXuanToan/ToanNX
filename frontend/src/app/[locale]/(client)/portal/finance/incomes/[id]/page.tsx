import { FINANCE_API_ENDPOINTS } from "@/modules/finance/constants/api-endpoints";
import { IncomeDetailView } from "@/modules/finance/views/income/income-detail-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.incomes" });

/** Chi tiết thu nhập cá nhân. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <IncomeDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${FINANCE_API_ENDPOINTS.incomes}/${id}/history`}
          fieldPrefix="finance.history.fields"
        />
      }
    />
  );
}
