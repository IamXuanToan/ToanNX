import { ExchangeRateCreateView } from "@/modules/system/views/exchange-rate-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.exchangeRates.title" });

/** Trang exchange-rates/new. */
export default function Page() {
  return <ExchangeRateCreateView />;
}
