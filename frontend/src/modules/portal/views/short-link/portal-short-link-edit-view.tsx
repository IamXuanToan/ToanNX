"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PortalShortLinkEdit } from "../../components/short-link/portal-short-link-edit";

/**
 * View sửa link rút gọn trong Client Portal.
 *
 * @param props - Id liên kết.
 * @returns Giao diện view.
 */
export function PortalShortLinkEditView({ id }: { id: string }) {
  const canRead = usePermission(SHORT_LINK_PERMISSIONS.read);
  const canUpdate = usePermission(SHORT_LINK_PERMISSIONS.update);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return <PortalShortLinkEdit id={id} canUpdate={canUpdate} />;
}
