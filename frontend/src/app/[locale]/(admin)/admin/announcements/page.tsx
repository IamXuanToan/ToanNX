import { AnnouncementListView } from "@/modules/system/views/announcement-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.notifications.announcements.title",
});

/** Trang announcements. */
export default function Page() {
  return <AnnouncementListView />;
}
