"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { ShortLinkProfile } from "../components/short-link-profile";
import { SHORT_LINK_PERMISSIONS } from "../permissions/short-link-permission";

/**
 * Trang chi tiết link rút gọn.
 *
 * @param props - Id và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết.
 */
export function ShortLinkDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(SHORT_LINK_PERMISSIONS.read);
  const canUpdate = usePermission(SHORT_LINK_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <ShortLinkProfile id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
