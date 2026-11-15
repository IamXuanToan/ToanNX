"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { PageProfile } from "../components/page-profile/page-profile";
import { CUSTOM_PAGES_PERMISSIONS as P } from "../constants/custom-pages-permissions";

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
  const canUpdate = usePermission(P.update);
  const canCreatePath = usePermission(P.pathCreate);
  const canUpdatePath = usePermission(P.pathUpdate);
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
