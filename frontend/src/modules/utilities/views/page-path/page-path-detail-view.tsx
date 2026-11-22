"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { PagePathProfile } from "../../components/page-path/page-path-profile";
import { PAGE_PATH_PERMISSIONS } from "../../permissions/page-path-permission";

/**
 * Trang chi tiết đường dẫn giữa.
 *
 * @param props - Id và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết.
 */
export function PagePathDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(PAGE_PATH_PERMISSIONS.read);
  const canUpdate = usePermission(PAGE_PATH_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <PagePathProfile id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
