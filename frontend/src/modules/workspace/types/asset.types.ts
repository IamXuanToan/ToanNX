import type { Attachment } from "@/modules/system/types/attachment.types";
import type { ListParams } from "@/shares/types/api.types";

import type {
  ASSET_CATEGORIES,
  ASSET_PURCHASE_CHANNELS,
  ASSET_STATUSES,
  ASSET_WARRANTY_TYPES,
} from "../constants/defaults";

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];
export type AssetStatus = (typeof ASSET_STATUSES)[number];
export type AssetPurchaseChannel = (typeof ASSET_PURCHASE_CHANNELS)[number];
export type AssetWarrantyType = (typeof ASSET_WARRANTY_TYPES)[number];

/** Thiết bị cá nhân (khớp `AssetResponse`). */
export type Asset = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  name: string;
  brand: string;
  modelCode: string;
  category: AssetCategory;
  serialNumber: string;
  imei: string;
  specs: Record<string, unknown>;
  status: AssetStatus;
  purchaseDate: string;
  purchasePrice: string;
  currencyId: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDecimalPlaces: number;
  exchangeRate: string;
  purchasePriceVnd: string;
  purchaseStore: string;
  purchaseChannel: AssetPurchaseChannel;
  purchaseBranchAddress: string;
  purchaseOrderCode: string;
  purchaseOrderUrl: string;
  storeWarrantyContact: string;
  warrantyType: AssetWarrantyType;
  warrantyMonths: number | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  warrantyProvider: string;
  warrantyNote: string;
  invoiceAttachments: Attachment[];
  notes: string;
  warrantyClaimCount: number;
  repairCount: number;
  totalClaimCount: number;
  openClaimCount: number;
  totalServiceCostVnd: string;
  lastClaimDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Đầu vào tạo/cập nhật Thiết bị. */
export type AssetInput = {
  name: string;
  brand?: string;
  modelCode?: string;
  category?: AssetCategory;
  serialNumber?: string;
  imei?: string;
  specs?: Record<string, unknown>;
  status?: AssetStatus;
  purchaseDate: string;
  purchasePrice?: string;
  currencyId: string;
  exchangeRate?: string | null;
  purchaseStore?: string;
  purchaseChannel?: AssetPurchaseChannel;
  purchaseBranchAddress?: string;
  purchaseOrderCode?: string;
  purchaseOrderUrl?: string;
  storeWarrantyContact?: string;
  warrantyType?: AssetWarrantyType;
  warrantyMonths?: number | null;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  warrantyProvider?: string;
  warrantyNote?: string;
  invoiceAttachmentIds?: string[];
  notes?: string;
};

/** Bộ lọc danh sách Thiết bị. */
export type AssetFilters = ListParams & {
  category?: readonly string[];
  status?: readonly string[];
  warrantyType?: readonly string[];
  purchaseChannel?: readonly string[];
  owner?: string;
};
