"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PAGE_PATH_PERMISSIONS } from "@/modules/utilities/permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { PortalPageEdit } from "../../components/page/portal-page-edit";

/**
 * View chi tiết và sửa trang trong Client Portal.
 *
 * @param props - Id trang.
 * @returns Giao diện view.
 */
export function PortalPageEditView({ id }: { id: string }) {
  const canRead = usePermission(PAGE_PERMISSIONS.read);
  const canUpdate = usePermission(PAGE_PERMISSIONS.update);
  const canManageAll = usePermission(PAGE_PERMISSIONS.manageAll);
  const isEditing = useEditMode(canUpdate);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.create);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.update);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return (
    <EditModeProvider canEdit={canUpdate}>
      <PortalPageEdit
        id={id}
        canUpdate={isEditing}
        canManageAll={canManageAll}
        canCreatePath={canCreatePath && isEditing}
        canUpdatePath={canUpdatePath && isEditing}
      />
    </EditModeProvider>
  );
}
