"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { qrCodeService } from "@/modules/utilities/services/qr-code.service";
import { PortalQrCodeForm } from "./portal-qr-code-form";

/**
 * Component chỉnh sửa mã QR trong Client Portal.
 *
 * @param props - ID mã QR và cờ quyền sửa.
 * @returns Giao diện chỉnh sửa mã QR.
 */
export function PortalQrCodeEdit({ id, canUpdate }: { id: string; canUpdate: boolean }) {
  const t = useTranslations("portal.qrCodes");

  const {
    data: code,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["portal-qr-code-detail", id],
    queryFn: () => qrCodeService.get(id),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (isError || !code) {
    return (
      <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-6 text-center">
        <p className="text-destructive text-sm font-medium">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
          {t("editTitle", { name: code.name })}
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{t("editDescription")}</p>
      </div>

      <PortalQrCodeForm code={code} disabled={!canUpdate} />
    </div>
  );
}
