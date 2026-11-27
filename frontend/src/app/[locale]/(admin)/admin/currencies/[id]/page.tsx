import { SYSTEM_API_ENDPOINTS } from "@/modules/system/constants/api-endpoints";
import { CurrencyDetailView } from "@/modules/system/views/currency/currency-detail-view";
import { RecordHistoryView } from "@/modules/system/views/journal-entry/record-history-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "system.currencies.title" });

/** Trang chi tiết tiền tệ kèm lịch sử thay đổi. */
export default async function Page({ params }: PageProps<"/[locale]/admin/currencies/[id]">) {
  const { id } = await params;
  return (
    <CurrencyDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${SYSTEM_API_ENDPOINTS.currencies}/${id}/history`}
          fieldPrefix="system.currencies.fields"
        />
      }
    />
  );
}
