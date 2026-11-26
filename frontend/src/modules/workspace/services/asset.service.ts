import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { Asset, AssetFilters, AssetInput } from "../types/asset.types";

/** Service quản lý Thiết bị cá nhân (BE `asset_service.py`). */
export const assetService = createCrudService<
  Asset,
  AssetFilters,
  AssetInput,
  Partial<AssetInput>,
  Asset
>(WORKSPACE_API_ENDPOINTS.assets, { opaqueKeys: ["specs"] });
