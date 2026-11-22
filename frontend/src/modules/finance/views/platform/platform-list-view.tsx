"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/modules/system/components/permission/permission-gate";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { PlatformTable } from "../../components/platform/platform-table";
import { FINANCE_ROUTES } from "../../constants/routes";
import { PLATFORM_PERMISSIONS } from "../../permissions/platform-permission";

/** Trang danh sách (finance.platforms). */
export function PlatformListView() {
  const t = useTranslations("finance.platforms");
  const canRead = usePermission(PLATFORM_PERMISSIONS.read);
  const canCreate = usePermission(PLATFORM_PERMISSIONS.create);
  const canUpdate = usePermission(PLATFORM_PERMISSIONS.update);
  const canDelete = usePermission(PLATFORM_PERMISSIONS.delete);
  if (!canRead) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <PermissionGate permission={PLATFORM_PERMISSIONS.create}>
            <Button asChild>
              <Link href={FINANCE_ROUTES.platformCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      <PlatformTable canCreate={canCreate} canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
