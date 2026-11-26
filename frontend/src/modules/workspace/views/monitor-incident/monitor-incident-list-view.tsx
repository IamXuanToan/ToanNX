"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { MonitorIncidentTable } from "../../components/monitor-incident/monitor-incident-table";
import { MONITOR_INCIDENT_PERMISSIONS } from "../../permissions/monitor-incident-permission";

/** @returns Trang danh sách Sự cố Uptime. */
export function MonitorIncidentListView() {
  const t = useTranslations("workspace.monitorIncidents");
  const canRead = usePermission(MONITOR_INCIDENT_PERMISSIONS.read);
  const canDelete = usePermission(MONITOR_INCIDENT_PERMISSIONS.delete);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <MonitorIncidentTable canDelete={canDelete} />
    </div>
  );
}
