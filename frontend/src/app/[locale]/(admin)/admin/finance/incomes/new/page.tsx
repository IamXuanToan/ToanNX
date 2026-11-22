import { IncomeCreateView } from "@/modules/finance/views/income-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.incomes" });

/** Tạo incomes. */
export default function Page() {
  return <IncomeCreateView />;
}
