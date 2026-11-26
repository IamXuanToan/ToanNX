"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { ReminderDetail } from "../../components/reminder/reminder-detail";
import { REMINDER_PERMISSIONS } from "../../permissions/reminder-permission";

/** @param props - ID nhắc việc và slot lịch sử. @returns Trang chi tiết Nhắc việc. */
export function ReminderDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(REMINDER_PERMISSIONS.read);
  const canUpdate = usePermission(REMINDER_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <ReminderDetail id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
