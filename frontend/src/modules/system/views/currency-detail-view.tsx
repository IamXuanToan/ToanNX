"use client";

import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { CurrencyProfile } from "../components/currency-profile";
import { usePermission } from "../hooks/use-permission";
import { CURRENCY_PERMISSIONS } from "../permissions/currency-permission";

/** @param props - Id. @returns Trang chi tiết tiền tệ. */
export function CurrencyDetailView({ id }: { id: string }) {
  const canRead = usePermission(CURRENCY_PERMISSIONS.read);
  const canUpdate = usePermission(CURRENCY_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canUpdate}>
      <CurrencyProfile id={id} canUpdate={isEditing} />
    </EditModeProvider>
  );
}
