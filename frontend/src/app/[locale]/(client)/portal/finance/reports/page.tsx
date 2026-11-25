import { FinanceReportView } from "@/modules/finance/views/finance-report/finance-report-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.reports" });

/** Báo cáo tài chính cá nhân. */
export default function Page() {
  return <FinanceReportView />;
}
