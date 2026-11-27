"use client";

import { useRouter } from "@/i18n/navigation";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { workspaceKeys } from "../../../constants/query-keys";
import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useAssets } from "../../../hooks/use-assets";
import { useDeleteAsset } from "../../../hooks/use-delete-asset";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { ASSET_PERMISSIONS } from "../../../permissions/asset-permission";
import { assetService } from "../../../services/asset.service";
import type { Asset } from "../../../types/asset.types";

const FILTER_KEYS = ["category", "status", "warrantyType", "purchaseChannel", "owner"] as const;

/** @returns State bảng Thiết bị cá nhân đồng bộ URL query params. */
export function useAssetTable() {
  const router = useRouter();
  const ownerFilter = useWorkspaceOwnerOptions(ASSET_PERMISSIONS.manageAll);
  const table = useTableState({ ordering: "-created_at", filterKeys: FILTER_KEYS });
  const query = useAssets({
    ...table.filters,
    category: table.getFilterValues("category"),
    status: table.getFilterValues("status"),
    warrantyType: table.getFilterValues("warrantyType"),
    purchaseChannel: table.getFilterValues("purchaseChannel"),
    owner: ownerFilter.canFilterOwner ? table.extraFilters.owner : undefined,
  });
  const remove = useDeleteAsset();
  const bulk = useBulkActions<Asset>({
    service: assetService,
    invalidate: [workspaceKeys.all],
  });

  return {
    table,
    query,
    ...ownerFilter,
    view: (item: Asset) => router.push(WORKSPACE_ROUTES.assetDetail(item.id)),
    edit: (item: Asset) => router.push(withEditMode(WORKSPACE_ROUTES.assetDetail(item.id))),
    remove: (item: Asset) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
