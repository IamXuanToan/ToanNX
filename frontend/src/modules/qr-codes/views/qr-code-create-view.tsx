"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { QrCodeForm } from "../components/qr-code-form/qr-code-form";
import { QR_CODES_PERMISSIONS } from "../constants/qr-codes-permissions";

/** Trang tạo mã QR. */
export function QrCodeCreateView() {
  const t = useTranslations("qrCodes");
  const canCreate = usePermission(QR_CODES_PERMISSIONS.create);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <QrCodeForm />
    </FormPage>
  );
}
