import { FINANCE_API_ENDPOINTS } from "@/modules/finance/constants/api-endpoints";
import { IncomeDetailView } from "@/modules/finance/views/income-detail-view";
import { RecordHistoryView } from "@/modules/system/views/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.incomes" });

/** Chi tiết incomes. */
export default async function Page({ params }: PageProps<"/[locale]/admin/finance/incomes/[id]">) {
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
