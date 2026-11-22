"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { ExchangeRateTable } from "../components/exchange-rate-table";
import { PermissionGate } from "../components/permission-gate";
import { SYSTEM_ROUTES } from "../constants/routes";
import { usePermission } from "../hooks/use-permission";
import { EXCHANGE_RATE_PERMISSIONS } from "../permissions/exchange-rate-permission";

/** Trang Hệ thống → Tỷ giá (API Vietcombank + nhập tay). */
export function ExchangeRateListView() {
  const t = useTranslations("system.exchangeRates");
  const canRead = usePermission(EXCHANGE_RATE_PERMISSIONS.read);
  const canDelete = usePermission(EXCHANGE_RATE_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={EXCHANGE_RATE_PERMISSIONS.create}>
            <Button asChild>
              <Link href={SYSTEM_ROUTES.exchangeRateCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <ExchangeRateTable canDelete={canDelete} />
    </div>
  );
}
