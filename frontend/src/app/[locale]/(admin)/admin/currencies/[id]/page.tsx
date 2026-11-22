import { CurrencyDetailView } from "@/modules/system/views/currency-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.currencies.title" });

/** Trang chi tiết. */
export default async function Page({ params }: PageProps<"/[locale]/admin/currencies/[id]">) {
  const { id } = await params;
  return <CurrencyDetailView id={id} />;
}
