import { CurrencyListView } from "@/modules/system/views/currency/currency-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.currencies.title" });

/** Trang currencies. */
export default function Page() {
  return <CurrencyListView />;
}
