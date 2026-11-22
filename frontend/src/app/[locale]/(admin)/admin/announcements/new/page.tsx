import { AnnouncementCreateView } from "@/modules/system/views/announcement/announcement-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({
  title: "system.notifications.announcements.title",
});

/** Trang announcements/new. */
export default function Page() {
  return <AnnouncementCreateView />;
}
