import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { WORKSPACE_API_ENDPOINTS } from "@/modules/workspace/constants/api-endpoints";
import { ReminderDetailView } from "@/modules/workspace/views/reminder/reminder-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.reminders.editTitle",
});

/** Chi tiết Nhắc việc cá nhân. */
export default async function ReminderDetailPage({
  params,
}: PageProps<"/[locale]/portal/reminders/[id]">) {
  const { id } = await params;
  return (
    <ReminderDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${WORKSPACE_API_ENDPOINTS.reminders}/${id}/history`}
          fieldPrefix="workspace.reminders.fields"
        />
      }
    />
  );
}
