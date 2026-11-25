"use client";

import { useTranslations } from "next-intl";

import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { usePermission } from "@/modules/system/hooks/use-permission";

import { DonationTable } from "../../components/donation/donation-table";
import { DONATION_PERMISSIONS } from "../../permissions/donation-permission";

/**
 * View Quản lý Lịch sử Quyên góp trong khu vực Quản trị Admin.
 */
export function DonationListView() {
  const t = useTranslations("utilities.donations");
  const canRead = usePermission(DONATION_PERMISSIONS.read);
  const canUpdate = usePermission(DONATION_PERMISSIONS.update);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
      </div>

      <DonationTable canUpdate={canUpdate} />
    </div>
  );
}
