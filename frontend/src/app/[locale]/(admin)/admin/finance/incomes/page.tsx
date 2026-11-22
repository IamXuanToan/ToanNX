import { IncomeListView } from "@/modules/finance/views/income-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.incomes" });

/** Danh sách incomes. */
export default function Page() {
  return <IncomeListView />;
}
