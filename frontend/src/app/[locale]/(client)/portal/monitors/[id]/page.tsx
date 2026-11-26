import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { WORKSPACE_API_ENDPOINTS } from "@/modules/workspace/constants/api-endpoints";
import { MonitorTargetDetailView } from "@/modules/workspace/views/monitor-target/monitor-target-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.monitors.editTitle",
});

/** Chi tiết Endpoint Uptime kèm sự cố và lịch sử thay đổi. */
export default async function MonitorDetailPage({
  params,
}: PageProps<"/[locale]/portal/monitors/[id]">) {
  const { id } = await params;
  return (
    <MonitorTargetDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${WORKSPACE_API_ENDPOINTS.monitorTargets}/${id}/history`}
          fieldPrefix="workspace.monitors.fields"
        />
      }
    />
  );
}
