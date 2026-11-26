"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { MonitorTargetTable } from "../../components/monitor-target/monitor-target-table";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import { MONITOR_TARGET_PERMISSIONS } from "../../permissions/monitor-target-permission";

/** @returns Trang danh sách Endpoint giám sát Uptime. */
export function MonitorTargetListView() {
  const t = useTranslations("workspace.monitors");
  const canRead = usePermission(MONITOR_TARGET_PERMISSIONS.read);
  const canCreate = usePermission(MONITOR_TARGET_PERMISSIONS.create);
  const canUpdate = usePermission(MONITOR_TARGET_PERMISSIONS.update);
  const canDelete = usePermission(MONITOR_TARGET_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={WORKSPACE_ROUTES.monitorCreate}>
                <Plus />
                {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <MonitorTargetTable canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
