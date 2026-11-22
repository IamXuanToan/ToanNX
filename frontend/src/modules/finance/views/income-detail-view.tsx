"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { IncomeProfile } from "../components/income-profile";
import { INCOME_PERMISSIONS } from "../permissions/income-permission";

/** @param props - Id, slot lịch sử. @returns Trang chi tiết. */
export function IncomeDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(INCOME_PERMISSIONS.read);
  const canUpdate = usePermission(INCOME_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <IncomeProfile id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
