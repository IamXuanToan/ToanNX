import { CurrencyCreateView } from "@/modules/system/views/currency/currency-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.currencies.title" });

/** Trang currencies/new. */
export default function Page() {
  return <CurrencyCreateView />;
}
