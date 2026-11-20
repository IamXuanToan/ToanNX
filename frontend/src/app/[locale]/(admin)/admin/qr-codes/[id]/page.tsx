import { RecordHistoryView } from "@/modules/system/views/record-history-view";
import { UTILITIES_API_ENDPOINTS } from "@/modules/utilities/constants/api-endpoints";
import { QrCodeDetailView } from "@/modules/utilities/views/qr-code-detail-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.qrCodes" });

/**
 * Trang chi tiết mã QR (module Tiện ích) + lịch sử thay đổi (Journal) qua slot `history`.
 *
 * @param props - Tham số route.
 * @returns QrCodeDetailView.
 */
export default async function QrCodeDetailPage({
  params,
}: PageProps<"/[locale]/admin/qr-codes/[id]">) {
  const { id } = await params;
  return (
    <QrCodeDetailView
      id={id}
      history={
        <RecordHistoryView
          path={`${UTILITIES_API_ENDPOINTS.qrCodes}/${id}/history`}
          fieldPrefix="utilities.qrCodes.fields"
        />
      }
    />
  );
}
