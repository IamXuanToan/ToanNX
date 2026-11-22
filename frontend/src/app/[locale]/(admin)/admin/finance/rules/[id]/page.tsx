import { FINANCE_API_ENDPOINTS } from "@/modules/finance/constants/api-endpoints";
import { ClassificationRuleDetailView } from "@/modules/finance/views/classification-rule-detail-view";
import { RecordHistoryView } from "@/modules/system/views/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.rules" });

/** Chi tiết rules. */
export default async function Page({ params }: PageProps<"/[locale]/admin/finance/rules/[id]">) {
  const { id } = await params;
  return (
    <ClassificationRuleDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${FINANCE_API_ENDPOINTS.rules}/${id}/history`}
          fieldPrefix="finance.history.fields"
        />
      }
    />
  );
}
