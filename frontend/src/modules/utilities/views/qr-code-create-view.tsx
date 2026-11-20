"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { QrCodeForm } from "../components/qr-code-form";
import { QR_CODE_PERMISSIONS } from "../permissions/qr-code-permission";

/** Trang tạo mã QR. */
export function QrCodeCreateView() {
  const t = useTranslations("utilities.qrCodes");
  const canCreate = usePermission(QR_CODE_PERMISSIONS.create);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <QrCodeForm />
    </FormPage>
  );
}
