import { RecordHistoryView } from "@/modules/journal/views/record-history-view";
import { QR_CODES_API_ENDPOINTS } from "@/modules/qr-codes/constants/api-endpoints";
import { createPageMetadata } from "@/shares/lib/seo";

import { QrCodeEditor } from "../qr-code-editor";

export const generateMetadata = createPageMetadata({ title: "qrCodes.nav.codes" });

/**
 * Trang chi tiết mã QR (QR Codes) + lịch sử thay đổi (Journal) qua slot `history`.
 *
 * @param props - Tham số route.
 * @returns QrCodeDetailView.
 */
export default async function QrCodeDetailPage({
  params,
}: PageProps<"/[locale]/admin/qr-codes/[id]">) {
  const { id } = await params;
  return (
    <QrCodeEditor
      id={id}
      history={
        <RecordHistoryView
          path={`${QR_CODES_API_ENDPOINTS.codes}/${id}/history`}
          fieldPrefix="qrCodes.fields"
        />
      }
    />
  );
}
