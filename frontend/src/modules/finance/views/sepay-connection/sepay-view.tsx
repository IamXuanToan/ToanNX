"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { SepayConnection } from "../../components/sepay-connection/sepay-connection";
import { SepayImport } from "../../components/sepay-connection/sepay-import";
import { INCOME_PERMISSIONS } from "../../permissions/income-permission";
import { SEPAY_PERMISSIONS } from "../../permissions/sepay-permission";

/** Trang Kết nối SePay của chính mình + lấy giao dịch thủ công. */
export function SepayView() {
  const t = useTranslations("finance.sepay");
  const canManage = usePermission(SEPAY_PERMISSIONS.manage);
  const canImport = usePermission(INCOME_PERMISSIONS.create);
  if (!canManage) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <SepayConnection />
      {canImport ? <SepayImport /> : null}
    </div>
  );
}
