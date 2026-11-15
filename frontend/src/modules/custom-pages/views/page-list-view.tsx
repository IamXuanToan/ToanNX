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
import { CUSTOM_PAGES_PERMISSIONS as P } from "../constants/custom-pages-permissions";
import { CUSTOM_PAGES_ROUTES } from "../constants/routes";

/** Trang danh sách trang công khai. */
export function PageListView() {
  const t = useTranslations("customPages.pages");
  const canRead = usePermission(P.read);
  const canCreate = usePermission(P.create);
  const canUpdate = usePermission(P.update);
  const canDelete = usePermission(P.delete);
  const canManageAll = usePermission(P.manageAll);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={P.create}>
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
