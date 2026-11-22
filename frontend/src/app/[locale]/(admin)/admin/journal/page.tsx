import { JournalListView } from "@/modules/system/views/journal-entry/journal-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.journal.nav.entries" });

/** Trang nhật ký thay đổi toàn hệ thống. */
export default function JournalPage() {
  return <JournalListView />;
}
