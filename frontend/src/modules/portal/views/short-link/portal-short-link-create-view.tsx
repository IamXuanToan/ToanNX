"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { SHORT_LINK_PERMISSIONS } from "@/modules/utilities/permissions/short-link-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PortalShortLinkCreate } from "../../components/short-link/portal-short-link-create";

/**
 * View tạo link rút gọn trong Client Portal.
 *
 * @returns Giao diện view.
 */
export function PortalShortLinkCreateView() {
  const canCreate = usePermission(SHORT_LINK_PERMISSIONS.create);

  if (!canCreate) {
    return <ForbiddenView />;
  }

  return <PortalShortLinkCreate />;
}
