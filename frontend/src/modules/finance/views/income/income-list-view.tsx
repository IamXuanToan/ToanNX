"use client";

import { useTranslations } from "next-intl";

import { PermissionGate } from "@/modules/system/components/permission/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { IncomeCreateButton } from "../../components/income/income-create-button";
import { IncomeTable } from "../../components/income/income-table";
import { INCOME_PERMISSIONS } from "../../permissions/income-permission";

/** Trang danh sách (finance.incomes). */
export function IncomeListView() {
  const t = useTranslations("finance.incomes");
  const canRead = usePermission(INCOME_PERMISSIONS.read);
  const canUpdate = usePermission(INCOME_PERMISSIONS.update);
  const canDelete = usePermission(INCOME_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={INCOME_PERMISSIONS.create}>
            <IncomeCreateButton />
          </PermissionGate>
        }
      />
      <IncomeTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
