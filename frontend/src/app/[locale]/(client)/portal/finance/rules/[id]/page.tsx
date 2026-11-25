import { FINANCE_API_ENDPOINTS } from "@/modules/finance/constants/api-endpoints";
import { ClassificationRuleDetailView } from "@/modules/finance/views/classification-rule/classification-rule-detail-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.rules" });

/** Chi tiết quy tắc phân loại cá nhân. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
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
