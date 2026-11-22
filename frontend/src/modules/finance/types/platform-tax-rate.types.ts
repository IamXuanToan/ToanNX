/** Một mốc khấu trừ (BE `PlatformTaxRateResponseSerializer`). */
export type PlatformTaxRate = {
  id: string;
  platformId: string;
  effectiveFrom: string;
  taxWithheld: boolean;
  rate: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type PlatformTaxRateInput = {
  effectiveFrom?: string;
  taxWithheld?: boolean;
  rate?: string;
  note?: string;
};

/** Kết quả thêm/sửa/xóa mốc: giao dịch có % đang chụp khác lịch sử mới. */
export type PlatformTaxRateMutation = {
  entry: PlatformTaxRate | null;
  affectedIncomeIds: string[];
};
