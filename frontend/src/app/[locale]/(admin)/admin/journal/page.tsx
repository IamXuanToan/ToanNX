import { JournalListView } from "@/modules/journal/views/journal-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "journal.nav.entries" });

/** Trang nhật ký thay đổi toàn hệ thống. */
export default function JournalPage() {
  return <JournalListView />;
}
