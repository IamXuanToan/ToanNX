"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ATTACHMENT_PERMISSIONS } from "@/modules/system/permissions/attachment-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PortalLibrary } from "../../components/library/portal-library";

/**
 * View thư viện tệp trong Client Portal:
 * Kiểm tra quyền đọc và render PortalLibrary.
 *
 * @returns View thư viện tệp.
 */
export function PortalLibraryView() {
  const canRead = usePermission(ATTACHMENT_PERMISSIONS.read);

  if (!canRead) {
    return <ForbiddenView />;
  }

  return <PortalLibrary />;
}
