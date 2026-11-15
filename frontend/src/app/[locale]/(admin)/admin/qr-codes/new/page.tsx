import { QrCodeCreateView } from "@/modules/qr-codes/views/qr-code-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "qrCodes.create" });

/** Trang tạo mã QR. */
export default function QrCodeCreatePage() {
  return <QrCodeCreateView />;
}
