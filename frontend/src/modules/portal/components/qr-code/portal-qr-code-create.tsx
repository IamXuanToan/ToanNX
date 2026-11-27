"use client";

import { useTranslations } from "next-intl";

import { FormPage } from "@/shares/components/common/form-page";

import { PortalQrCodeForm } from "./portal-qr-code-form";

/**
 * Component tạo mã QR mới trong Client Portal.
 *
 * @param props - Cờ quyền tạo.
 * @returns Giao diện tạo mã QR dùng chung `FormPage`.
 */
export function PortalQrCodeCreate({ canCreate }: { canCreate: boolean }) {
  const t = useTranslations("portal.qrCodes");

  return (
    <FormPage title={t("createTitle")}>
      <PortalQrCodeForm disabled={!canCreate} />
    </FormPage>
  );
}
