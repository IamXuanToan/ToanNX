"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { PlatformProfile } from "../components/platform-profile";
import { PLATFORM_PERMISSIONS } from "../permissions/platform-permission";

/** @param props - Id, slot lịch sử. @returns Trang chi tiết. */
export function PlatformDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(PLATFORM_PERMISSIONS.read);
  const canUpdate = usePermission(PLATFORM_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <PlatformProfile id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
