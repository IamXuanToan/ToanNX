"use client";

import type { ReactNode } from "react";

import { AttachmentImageUploadView } from "@/modules/attachment/views/attachment-image-upload-view";
import { QrCodeCreateView } from "@/modules/qr-codes/views/qr-code-create-view";
import { QrCodeDetailView } from "@/modules/qr-codes/views/qr-code-detail-view";

/** Ghép bộ chọn logo từ Thư viện vào form QR tại page. */
export function QrCodeEditor({ id, history }: { id?: string; history?: ReactNode }) {
  if (id) {
    return <QrCodeDetailView id={id} history={history} LogoUpload={AttachmentImageUploadView} />;
  }
  return <QrCodeCreateView LogoUpload={AttachmentImageUploadView} />;
}
