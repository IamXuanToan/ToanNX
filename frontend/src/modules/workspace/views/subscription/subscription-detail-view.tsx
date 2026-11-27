"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { SubscriptionDetail } from "../../components/subscription/subscription-detail";
import { SUBSCRIPTION_PAYMENT_PERMISSIONS } from "../../permissions/subscription-payment-permission";
import { SUBSCRIPTION_PERMISSIONS } from "../../permissions/subscription-permission";

/** @param props - ID dịch vụ định kỳ và slot lịch sử. @returns Trang chi tiết Dịch vụ. */
export function SubscriptionDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(SUBSCRIPTION_PERMISSIONS.read);
  const canUpdate = usePermission(SUBSCRIPTION_PERMISSIONS.update);
  const canDeletePayment = usePermission(SUBSCRIPTION_PAYMENT_PERMISSIONS.delete);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <SubscriptionDetail
        id={id}
        canUpdate={isEditing}
        canRenew={canUpdate}
        canDeletePayment={canDeletePayment}
        history={history}
      />
    </EditModeProvider>
  );
}
