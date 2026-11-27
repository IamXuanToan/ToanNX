import { PortalDashboardView } from "@/modules/portal/views/dashboard/portal-dashboard-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "portal.navigation.dashboard" });

/** Tổng quan hợp nhất trong Client Portal. */
export default function Page() {
  return <PortalDashboardView />;
}
