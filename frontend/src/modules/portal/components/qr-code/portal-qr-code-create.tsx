"use client";

import { useTranslations } from "next-intl";

import { PortalQrCodeForm } from "./portal-qr-code-form";

/**
 * Component tạo mã QR mới trong Client Portal.
 *
 * @param props - Cờ quyền tạo.
 * @returns Giao diện tạo mã QR.
 */
export function PortalQrCodeCreate({ canCreate }: { canCreate: boolean }) {
  const t = useTranslations("portal.qrCodes");

  return (
    <div className="space-y-6">
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
          {t("createTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{t("createDescription")}</p>
      </div>

      <PortalQrCodeForm disabled={!canCreate} />
    </div>
  );
}
