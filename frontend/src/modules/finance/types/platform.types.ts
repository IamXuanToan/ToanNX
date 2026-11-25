import type { ListParams } from "@/shares/types/api.types";

/** Nền tảng (BE `PlatformResponseSerializer`); `currentTax` là mốc áp dụng hôm nay. */
export type Platform = {
  id: string;
  name: string;
  code: string;
  defaultCurrencyId: string;
  defaultCurrencyCode: string;
  isActive: boolean;
  note: string;
  currentTax: { effectiveFrom: string; taxWithheld: boolean; rate: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type PlatformFilters = ListParams & { owner?: string; isActive?: string };

export type PlatformInput = {
  name?: string;
  code?: string;
  defaultCurrencyId?: string;
  isActive?: boolean;
  note?: string;
};
