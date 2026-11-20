"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/auth/components/permission-gate";
import { usePermission } from "@/modules/auth/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { PagePathTable } from "../components/page-path-table";
import { PAGE_PATH_PERMISSIONS } from "../permissions/page-path-permission";
import { UTILITIES_ROUTES } from "../constants/routes";

/** Trang danh sách đường dẫn giữa. */
export function PagePathListView() {
  const t = useTranslations("utilities.customPages.paths");
  const canRead = usePermission(PAGE_PATH_PERMISSIONS.read);
  const canUpdate = usePermission(PAGE_PATH_PERMISSIONS.update);
  const canDelete = usePermission(PAGE_PATH_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={PAGE_PATH_PERMISSIONS.create}>
            <Button asChild>
              <Link href={UTILITIES_ROUTES.pagePathCreate}>
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
