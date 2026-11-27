import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  AssetWarrantyClaim,
  AssetWarrantyClaimFilters,
  AssetWarrantyClaimInput,
} from "../types/asset-warranty-claim.types";

/** Service quản lý Phiếu bảo hành / sửa chữa thiết bị (BE `asset_warranty_claim_service.py`). */
export const assetWarrantyClaimService = createCrudService<
  AssetWarrantyClaim,
  AssetWarrantyClaimFilters,
  AssetWarrantyClaimInput,
  Partial<AssetWarrantyClaimInput>,
  AssetWarrantyClaim
>(WORKSPACE_API_ENDPOINTS.warrantyClaims);
