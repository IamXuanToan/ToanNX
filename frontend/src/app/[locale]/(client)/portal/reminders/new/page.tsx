import { ReminderCreateView } from "@/modules/workspace/views/reminder/reminder-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "workspace.reminders.createTitle",
});

/** Trang tạo Nhắc việc cá nhân mới. */
export default function ReminderCreatePage() {
  return <ReminderCreateView />;
}
