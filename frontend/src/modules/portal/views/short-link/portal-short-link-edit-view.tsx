"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { PortalShortLinkEdit } from "../../components/short-link/portal-short-link-edit";

/**
 * View chi tiết và sửa link rút gọn trong Client Portal.
 *
 * @param props - Id liên kết và slot lịch sử thay đổi.
 * @returns Giao diện view.
 */
export function PortalShortLinkEditView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(SHORT_LINK_PERMISSIONS.read);
  const canUpdate = usePermission(SHORT_LINK_PERMISSIONS.update);
  const canManageAll = usePermission(SHORT_LINK_PERMISSIONS.manageAll);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return (
    <EditModeProvider canEdit={canUpdate}>
      <PortalShortLinkEdit
        id={id}
        canUpdate={isEditing}
        canManageAll={canManageAll}
        history={history}
      />
    </EditModeProvider>
  );
}
