"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { PageProfile } from "../components/page-profile";
import { PAGE_PATH_PERMISSIONS } from "../permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "../permissions/page-permission";

/**
 * Trang soạn trang.
 *
 * @param props - Id và lịch sử thay đổi (Journal, page ghép qua slot).
 * @returns Giao diện soạn.
 */
export function PageDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(PAGE_PERMISSIONS.read);
  const canUpdate = usePermission(PAGE_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.create);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.update);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <PageProfile
        id={id}
        canUpdate={isEditing}
        canCreatePath={canCreatePath && isEditing}
        canUpdatePath={canUpdatePath && isEditing}
        history={history}
      />
    </EditModeProvider>
  );
}
