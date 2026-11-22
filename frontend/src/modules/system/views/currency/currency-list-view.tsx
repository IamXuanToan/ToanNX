"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { CurrencyTable } from "../../components/currency/currency-table";
import { PermissionGate } from "../../components/permission/permission-gate";
import { SYSTEM_ROUTES } from "../../constants/routes";
import { usePermission } from "../../hooks/use-permission";
import { CURRENCY_PERMISSIONS } from "../../permissions/currency-permission";

/** Trang Hệ thống → Tiền tệ. */
export function CurrencyListView() {
  const t = useTranslations("system.currencies");
  const canRead = usePermission(CURRENCY_PERMISSIONS.read);
  const canUpdate = usePermission(CURRENCY_PERMISSIONS.update);
  const canDelete = usePermission(CURRENCY_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={CURRENCY_PERMISSIONS.create}>
            <Button asChild>
              <Link href={SYSTEM_ROUTES.currencyCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <CurrencyTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
