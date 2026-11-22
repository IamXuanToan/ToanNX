import { QrCodeCreateView } from "@/modules/utilities/views/qr-code-create-view";
import { createPageMetadata } from "@/shares/lib/seo";

export const generateMetadata = createPageMetadata({ title: "utilities.qrCodes.create" });

/**
 * Trang tạo mã QR (module Tiện ích).
 *
 * @returns QrCodeCreateView.
 */
export default function QrCodeCreatePage() {
  return <QrCodeCreateView />;
}
