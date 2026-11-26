import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { WORKSPACE_API_ENDPOINTS } from "@/modules/workspace/constants/api-endpoints";
import { SubscriptionDetailView } from "@/modules/workspace/views/subscription/subscription-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.subscriptions.editTitle",
});

/** Chi tiết Dịch vụ định kỳ kèm lịch sử gia hạn và lịch sử thay đổi. */
export default async function SubscriptionDetailPage({
  params,
}: PageProps<"/[locale]/portal/subscriptions/[id]">) {
  const { id } = await params;
  return (
    <SubscriptionDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${WORKSPACE_API_ENDPOINTS.subscriptions}/${id}/history`}
          fieldPrefix="workspace.subscriptions.fields"
        />
      }
    />
  );
}
