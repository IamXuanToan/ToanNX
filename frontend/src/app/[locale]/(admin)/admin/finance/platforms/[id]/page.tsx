import { FINANCE_API_ENDPOINTS } from "@/modules/finance/constants/api-endpoints";
import { PlatformDetailView } from "@/modules/finance/views/platform/platform-detail-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.platforms" });

/** Chi tiết platforms. */
export default async function Page({
  params,
}: PageProps<"/[locale]/admin/finance/platforms/[id]">) {
  const { id } = await params;
  return (
    <PlatformDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${FINANCE_API_ENDPOINTS.platforms}/${id}/history`}
          fieldPrefix="finance.history.fields"
        />
      }
    />
  );
}
