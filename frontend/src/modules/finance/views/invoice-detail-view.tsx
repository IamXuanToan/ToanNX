"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { InvoiceProfile } from "../components/invoice-profile";
import { INVOICE_PERMISSIONS } from "../permissions/invoice-permission";

/** @param props - Id, slot lịch sử. @returns Trang chi tiết. */
export function InvoiceDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(INVOICE_PERMISSIONS.read);
  const canUpdate = usePermission(INVOICE_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <InvoiceProfile id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
