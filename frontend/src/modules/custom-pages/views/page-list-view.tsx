"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { PageTable } from "../components/page-table/page-table";
import { PAGE_PERMISSIONS } from "../permissions/page-permission";
import { CUSTOM_PAGES_ROUTES } from "../constants/routes";

/** Trang danh sách trang công khai. */
export function PageListView() {
  const t = useTranslations("customPages.pages");
  const canRead = usePermission(PAGE_PERMISSIONS.read);
  const canCreate = usePermission(PAGE_PERMISSIONS.create);
  const canUpdate = usePermission(PAGE_PERMISSIONS.update);
  const canDelete = usePermission(PAGE_PERMISSIONS.delete);
  const canManageAll = usePermission(PAGE_PERMISSIONS.manageAll);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={PAGE_PERMISSIONS.create}>
            <Button asChild>
              <Link href={CUSTOM_PAGES_ROUTES.pageCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <PageTable
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        showOwner={canManageAll}
      />
    </div>
  );
}
