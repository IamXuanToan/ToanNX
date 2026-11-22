"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/system/components/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { InvoiceTable } from "../components/invoice-table";
import { FINANCE_ROUTES } from "../constants/routes";
import { INVOICE_PERMISSIONS } from "../permissions/invoice-permission";

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
            <Button asChild>
              <Link href={FINANCE_ROUTES.invoiceCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <InvoiceTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
