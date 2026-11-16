import { createPageMetadata } from "@/shares/lib/seo";

import { QrCodeEditor } from "../qr-code-editor";

export const generateMetadata = createPageMetadata({ title: "qrCodes.create" });

/** Trang tạo mã QR. */
export default function QrCodeCreatePage() {
  return <QrCodeEditor />;
}
