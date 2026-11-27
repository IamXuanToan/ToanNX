"use client";

import type { ReactNode } from "react";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { CurrencyProfile } from "../../components/currency/currency-profile";
import { usePermission } from "../../hooks/use-permission";
import { CURRENCY_PERMISSIONS } from "../../permissions/currency-permission";

/** @param props - Id và slot lịch sử. @returns Trang chi tiết tiền tệ. */
export function CurrencyDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(CURRENCY_PERMISSIONS.read);
  const canUpdate = usePermission(CURRENCY_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <CurrencyProfile id={id} canUpdate={isEditing} history={history} />
    </EditModeProvider>
  );
}
