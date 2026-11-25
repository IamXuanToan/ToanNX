import { IncomeCreateView } from "@/modules/finance/views/income/income-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "finance.nav.incomes" });

/** Tạo mới thu nhập cá nhân. */
export default function Page() {
  return <IncomeCreateView />;
}
