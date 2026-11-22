import { ExchangeRateListView } from "@/modules/system/views/exchange-rate-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.exchangeRates.title" });

/** Trang exchange-rates. */
export default function Page() {
  return <ExchangeRateListView />;
}
