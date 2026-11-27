"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { workspaceKeys } from "../../../constants/query-keys";
import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useDeleteSubscription } from "../../../hooks/use-delete-subscription";
import { useSubscriptions } from "../../../hooks/use-subscriptions";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { SUBSCRIPTION_PERMISSIONS } from "../../../permissions/subscription-permission";
import { subscriptionService } from "../../../services/subscription.service";
import type { Subscription } from "../../../types/subscription.types";

const FILTER_KEYS = ["category", "billingCycle", "isActive", "owner"] as const;

/** @returns State bảng Dịch vụ định kỳ + dialog Gia hạn. */
export function useSubscriptionTable() {
  const router = useRouter();
  const ownerFilter = useWorkspaceOwnerOptions(SUBSCRIPTION_PERMISSIONS.manageAll);
  const table = useTableState({ ordering: "renew_date", filterKeys: FILTER_KEYS });
  const isActiveRaw = table.extraFilters.isActive;
  const query = useSubscriptions({
    ...table.filters,
    category: table.getFilterValues("category"),
    billingCycle: table.getFilterValues("billingCycle"),
    isActive: isActiveRaw === "true" ? true : isActiveRaw === "false" ? false : undefined,
    owner: ownerFilter.canFilterOwner ? table.extraFilters.owner : undefined,
  });
  const remove = useDeleteSubscription();
  const toggleActive = useResourceMutation<{ id: string; isActive: boolean }, Subscription>({
    mutationFn: ({ id, isActive }) => subscriptionService.update(id, { isActive }),
    invalidate: [workspaceKeys.all],
  });
  const bulk = useBulkActions<Subscription>({
    service: subscriptionService,
    invalidate: [workspaceKeys.all],
  });
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null);

  return {
    table,
    query,
    ...ownerFilter,
    renewTarget,
    setRenewTarget,
    toggleActive: (item: Subscription, isActive: boolean) =>
      toggleActive.mutate({ id: item.id, isActive }),
    bulkSetActive: (rows: Subscription[], isActive: boolean) => bulk.bulkUpdate(rows, { isActive }),
    view: (item: Subscription) => router.push(WORKSPACE_ROUTES.subscriptionDetail(item.id)),
    edit: (item: Subscription) =>
      router.push(withEditMode(WORKSPACE_ROUTES.subscriptionDetail(item.id))),
    remove: (item: Subscription) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
