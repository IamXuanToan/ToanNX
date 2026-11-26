"use client";

import { useRouter } from "@/i18n/navigation";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { workspaceKeys } from "../../../constants/query-keys";
import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useAssetOptions } from "../../../hooks/use-asset-options";
import { useDeleteWarrantyClaim } from "../../../hooks/use-delete-warranty-claim";
import { useWarrantyClaims } from "../../../hooks/use-warranty-claims";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { ASSET_WARRANTY_CLAIM_PERMISSIONS } from "../../../permissions/asset-warranty-claim-permission";
import { assetWarrantyClaimService } from "../../../services/asset-warranty-claim.service";
import type { AssetWarrantyClaim } from "../../../types/asset-warranty-claim.types";

const FILTER_KEYS = ["asset", "claimType", "status", "isCoveredByWarranty", "owner"] as const;

/** @returns State bảng Phiếu bảo hành / sửa chữa. */
export function useWarrantyClaimTable() {
  const router = useRouter();
  const ownerFilter = useWorkspaceOwnerOptions(ASSET_WARRANTY_CLAIM_PERMISSIONS.manageAll);
  const assets = useAssetOptions();
  const table = useTableState({ ordering: "-submitted_date", filterKeys: FILTER_KEYS });
  const covered = table.extraFilters.isCoveredByWarranty;
  const query = useWarrantyClaims({
    ...table.filters,
    asset: table.extraFilters.asset || undefined,
    claimType: table.getFilterValues("claimType"),
    status: table.getFilterValues("status"),
    isCoveredByWarranty: covered === "true" ? true : covered === "false" ? false : undefined,
    owner: ownerFilter.canFilterOwner ? table.extraFilters.owner : undefined,
  });
  const remove = useDeleteWarrantyClaim();
  const bulk = useBulkActions<AssetWarrantyClaim>({
    service: assetWarrantyClaimService,
    invalidate: [workspaceKeys.all],
  });

  return {
    table,
    query,
    ...ownerFilter,
    assetOptions: assets.options,
    view: (item: AssetWarrantyClaim) => router.push(WORKSPACE_ROUTES.warrantyClaimDetail(item.id)),
    edit: (item: AssetWarrantyClaim) =>
      router.push(withEditMode(WORKSPACE_ROUTES.warrantyClaimDetail(item.id))),
    remove: (item: AssetWarrantyClaim) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
