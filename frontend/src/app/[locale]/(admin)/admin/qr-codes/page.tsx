import { QrCodeListView } from "@/modules/utilities/views/qr-code/qr-code-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.nav.qrCodes" });

/** Trang danh sách mã QR. */
export default function QrCodesPage() {
  return <QrCodeListView />;
}
