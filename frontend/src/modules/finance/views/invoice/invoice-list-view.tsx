"use client";

import { useTranslations } from "next-intl";

import { PermissionGate } from "@/modules/system/components/permission/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { InvoiceCreateButton } from "../../components/invoice/invoice-create-button";
import { InvoiceTable } from "../../components/invoice/invoice-table";
import { INVOICE_PERMISSIONS } from "../../permissions/invoice-permission";

/** Trang danh sách (finance.invoices). */
export function InvoiceListView() {
  const t = useTranslations("finance.invoices");
  const canRead = usePermission(INVOICE_PERMISSIONS.read);
  const canUpdate = usePermission(INVOICE_PERMISSIONS.update);
  const canDelete = usePermission(INVOICE_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={INVOICE_PERMISSIONS.create}>
            <InvoiceCreateButton />
          </PermissionGate>
        }
      />
      <InvoiceTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
