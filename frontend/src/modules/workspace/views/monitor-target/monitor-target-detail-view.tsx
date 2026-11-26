"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { MonitorTargetDetail } from "../../components/monitor-target/monitor-target-detail";
import { MONITOR_TARGET_PERMISSIONS } from "../../permissions/monitor-target-permission";

/** @param props - ID endpoint Uptime và slot lịch sử. @returns Trang chi tiết Endpoint. */
export function MonitorTargetDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(MONITOR_TARGET_PERMISSIONS.read);
  const canUpdate = usePermission(MONITOR_TARGET_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <MonitorTargetDetail id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
