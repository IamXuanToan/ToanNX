import { QrCodeListView } from "@/modules/qr-codes/views/qr-code-list-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "qrCodes.nav.codes" });

/** Trang danh sách mã QR. */
export default function QrCodesPage() {
  return <QrCodeListView />;
}
