import { FinanceDashboardView } from "@/modules/finance/views/finance-dashboard-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.dashboard" });

/** Tổng quan tài chính. */
export default function Page() {
  return <FinanceDashboardView />;
}
