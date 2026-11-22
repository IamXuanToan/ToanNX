"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { ClassificationRuleProfile } from "../components/classification-rule-profile";
import { RULE_PERMISSIONS } from "../permissions/rule-permission";

/** @param props - Id, slot lịch sử. @returns Trang chi tiết. */
export function ClassificationRuleDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(RULE_PERMISSIONS.read);
  const canUpdate = usePermission(RULE_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <ClassificationRuleProfile id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
