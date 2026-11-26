import { ReminderListView } from "@/modules/workspace/views/reminder/reminder-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.reminders.title",
});

/** Trang danh sách Nhắc việc cá nhân. */
export default function RemindersPage() {
  return <ReminderListView />;
}
