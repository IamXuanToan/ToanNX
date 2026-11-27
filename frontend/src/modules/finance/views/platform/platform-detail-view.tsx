"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { PlatformProfile } from "../../components/platform/platform-profile";
import { PLATFORM_PERMISSIONS } from "../../permissions/platform-permission";
import { RULE_PERMISSIONS } from "../../permissions/rule-permission";

/** @param props - Id, slot lịch sử. @returns Trang chi tiết. */
export function PlatformDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(PLATFORM_PERMISSIONS.read);
  const canUpdate = usePermission(PLATFORM_PERMISSIONS.update);
  const canReadRules = usePermission(RULE_PERMISSIONS.read);
  const canCreateRule = usePermission(RULE_PERMISSIONS.create);
  const canUpdateRule = usePermission(RULE_PERMISSIONS.update);
  const canDeleteRule = usePermission(RULE_PERMISSIONS.delete);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <PlatformProfile
        id={id}
        canUpdate={isEditing}
        canReadRules={canReadRules}
        canCreateRule={canCreateRule}
        canUpdateRule={canUpdateRule}
        canDeleteRule={canDeleteRule}
        history={history}
      />
    </EditModeProvider>
  );
}
