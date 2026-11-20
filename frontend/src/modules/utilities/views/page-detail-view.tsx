"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";

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
  const canUpdate = usePermission(PAGE_PERMISSIONS.update);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.create);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.update);
  return (
    <PageProfile
      id={id}
      canUpdate={canUpdate}
      canCreatePath={canCreatePath}
      canUpdatePath={canUpdatePath}
      history={history}
    />
  );
}
