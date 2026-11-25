import { FinanceDashboardView } from "@/modules/finance/views/dashboard/finance-dashboard-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.dashboard" });

/** Tổng quan tài chính cá nhân (Client Portal). */
export default function Page() {
  return <FinanceDashboardView />;
}
