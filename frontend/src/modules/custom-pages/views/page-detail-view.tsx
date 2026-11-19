"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { PageProfile } from "../components/page-profile/page-profile";
import { PAGE_PATH_PERMISSIONS } from "../permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "../permissions/page-permission";

/**
 * Trang soạn trang.
 *
 * @param props - Id, plugin editor của module khác (Mã QR, link rút gọn) và lịch sử thay đổi — page ghép.
 * @returns Giao diện soạn.
 */
export function PageDetailView({
  id,
  editorPlugins,
  history,
}: {
  id: string;
  editorPlugins?: ReactNode;
  history?: ReactNode;
}) {
  const canUpdate = usePermission(PAGE_PERMISSIONS.update);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.pathCreate);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.pathUpdate);
  return (
    <PageProfile
      id={id}
      canUpdate={canUpdate}
      canCreatePath={canCreatePath}
      canUpdatePath={canUpdatePath}
      editorPlugins={editorPlugins}
      history={history}
    />
  );
}
