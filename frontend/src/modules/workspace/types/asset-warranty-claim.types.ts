import type { Attachment } from "@/modules/system/types/attachment.types";
import type { ListParams } from "@/shares/types/api.types";

import type { CLAIM_STATUSES, CLAIM_TYPES } from "../constants/defaults";

export type WarrantyClaimType = (typeof CLAIM_TYPES)[number];
export type WarrantyClaimStatus = (typeof CLAIM_STATUSES)[number];

/** Phiếu bảo hành / sửa chữa thiết bị (khớp `AssetWarrantyClaimResponse`). */
export type AssetWarrantyClaim = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerUsername: string | null;
  assetId: string;
  assetName: string;
  assetBrand: string;
  claimCode: string;
  claimType: WarrantyClaimType;
  status: WarrantyClaimStatus;
  submittedDate: string;
  estimatedReturnDate: string | null;
  returnedDate: string | null;
  serviceCenter: string;
  serviceCenterAddress: string;
  serviceCenterContact: string;
  externalTicketCode: string;
  issueDescription: string;
  resolutionNotes: string;
  isCoveredByWarranty: boolean;
  cost: string;
  currencyId: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDecimalPlaces: number;
  exchangeRate: string;
  costVnd: string;
  partWarrantyMonths: number | null;
  partWarrantyEndDate: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
};

/** Đầu vào tạo/cập nhật Phiếu bảo hành/sửa chữa. */
export type AssetWarrantyClaimInput = {
  assetId: string;
  claimCode?: string;
  claimType?: WarrantyClaimType;
  status?: WarrantyClaimStatus;
  submittedDate: string;
  estimatedReturnDate?: string | null;
  returnedDate?: string | null;
  serviceCenter?: string;
  serviceCenterAddress?: string;
  serviceCenterContact?: string;
  externalTicketCode?: string;
  issueDescription: string;
  resolutionNotes?: string;
  isCoveredByWarranty?: boolean;
  cost?: string;
  currencyId: string;
  exchangeRate?: string | null;
  partWarrantyMonths?: number | null;
  partWarrantyEndDate?: string | null;
  attachmentIds?: string[];
};

/** Bộ lọc danh sách Phiếu bảo hành. */
export type AssetWarrantyClaimFilters = ListParams & {
  asset?: string;
  claimType?: readonly string[];
  status?: readonly string[];
  isCoveredByWarranty?: boolean;
  owner?: string;
};
