import { SessionListView } from "@/modules/auth/views/session-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "common.nav.sessions" });

/** Trang quản trị phiên. */
export default function SessionsPage() {
  return <SessionListView />;
}
