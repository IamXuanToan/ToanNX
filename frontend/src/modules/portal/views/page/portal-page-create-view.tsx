"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PAGE_PATH_PERMISSIONS } from "@/modules/utilities/permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "@/modules/utilities/permissions/page-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PortalPageCreate } from "../../components/page/portal-page-create";

/**
 * View tạo trang mới trong Client Portal.
 *
 * @returns Giao diện view.
 */
export function PortalPageCreateView() {
  const canCreate = usePermission(PAGE_PERMISSIONS.create);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.create);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.update);

  if (!canCreate) {
    return <ForbiddenView />;
  }

  return <PortalPageCreate canCreatePath={canCreatePath} canUpdatePath={canUpdatePath} />;
}
