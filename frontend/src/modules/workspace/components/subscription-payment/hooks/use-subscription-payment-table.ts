"use client";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";

import { workspaceKeys } from "../../../constants/query-keys";
import { useDeleteSubscriptionPayment } from "../../../hooks/use-delete-subscription-payment";
import { useSubscriptionOptions } from "../../../hooks/use-subscription-options";
import { useSubscriptionPayments } from "../../../hooks/use-subscription-payments";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { SUBSCRIPTION_PAYMENT_PERMISSIONS } from "../../../permissions/subscription-payment-permission";
import { subscriptionPaymentService } from "../../../services/subscription-payment.service";
import type { SubscriptionPayment } from "../../../types/subscription-payment.types";

const FILTER_KEYS = ["subscription", "owner"] as const;

/**
 * @param subscriptionId - Khi truyền ID dịch vụ (ở tab Lịch sử gia hạn), bảng tự khóa theo dịch vụ đó.
 * @returns State bảng Lịch sử thanh toán gia hạn dịch vụ.
 */
export function useSubscriptionPaymentTable(subscriptionId?: string) {
  const ownerFilter = useWorkspaceOwnerOptions(SUBSCRIPTION_PAYMENT_PERMISSIONS.manageAll);
  const subscriptions = useSubscriptionOptions();
  const table = useTableState({ ordering: "-paid_on", filterKeys: FILTER_KEYS });
  const query = useSubscriptionPayments({
    ...table.filters,
    subscription: subscriptionId ?? (table.extraFilters.subscription || undefined),
    owner: subscriptionId
      ? undefined
      : ownerFilter.canFilterOwner
        ? table.extraFilters.owner
        : undefined,
  });
  const remove = useDeleteSubscriptionPayment();
  const bulk = useBulkActions<SubscriptionPayment>({
    service: subscriptionPaymentService,
    invalidate: [workspaceKeys.all],
  });

  return {
    table,
    query,
    ...ownerFilter,
    subscriptionOptions: subscriptions.options,
    remove: (item: SubscriptionPayment) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
