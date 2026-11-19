"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { PagePathTable } from "../components/page-path-table/page-path-table";
import { PAGE_PATH_PERMISSIONS } from "../permissions/page-path-permission";
import { CUSTOM_PAGES_ROUTES } from "../constants/routes";

/** Trang danh sách đường dẫn giữa. */
export function PagePathListView() {
  const t = useTranslations("customPages.paths");
  const canRead = usePermission(PAGE_PATH_PERMISSIONS.pathRead);
  const canUpdate = usePermission(PAGE_PATH_PERMISSIONS.pathUpdate);
  const canDelete = usePermission(PAGE_PATH_PERMISSIONS.pathDelete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={PAGE_PATH_PERMISSIONS.pathCreate}>
            <Button asChild>
              <Link href={CUSTOM_PAGES_ROUTES.pathCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <PagePathTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
