import { IncomeListView } from "@/modules/finance/views/income/income-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.incomes" });

/** Danh sách thu nhập cá nhân. */
export default function Page() {
  return <IncomeListView />;
}
