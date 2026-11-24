"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PAGE_PATH_PERMISSIONS } from "@/modules/utilities/permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PortalPageEdit } from "../../components/page/portal-page-edit";

/**
 * View sửa trang trong Client Portal.
 *
 * @param props - Id trang.
 * @returns Giao diện view.
 */
export function PortalPageEditView({ id }: { id: string }) {
  const canRead = usePermission(PAGE_PERMISSIONS.read);
  const canUpdate = usePermission(PAGE_PERMISSIONS.update);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.create);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.update);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return (
    <PortalPageEdit
      id={id}
      canUpdate={canUpdate}
      canCreatePath={canCreatePath}
      canUpdatePath={canUpdatePath}
    />
  );
}
