import { UtilitiesDashboardView } from "@/modules/utilities/views/utilities-dashboard/utilities-dashboard-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.dashboard" });

/** Trang Dashboard tổng quan module Tiện ích (Admin). */
export default function UtilitiesDashboardPage() {
  return <UtilitiesDashboardView />;
}
