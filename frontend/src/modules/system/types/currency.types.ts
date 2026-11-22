import type { ListParams } from "@/shares/types/api.types";

/** Tiền tệ (BE `CurrencyResponseSerializer`). */
export type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type CurrencyInput = {
  code?: string;
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
  isActive?: boolean;
  position?: number;
};

/** Tỷ giá (BE `ExchangeRateResponseSerializer`). */
export type ExchangeRate = {
  id: string;
  currencyId: string;
  currencyCode: string;
  rateDate: string;
  rate: string;
  source: "VIETCOMBANK_TRANSFER_BUY" | "MANUAL";
  fetchedAt: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type ExchangeRateFilters = ListParams & {
  currency?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ExchangeRateInput = {
  currencyId?: string;
  rateDate?: string;
  rate?: string;
  note?: string;
};

/** Tỷ giá dùng cho một ngày (`rateDate` có thể sớm hơn ngày hỏi). */
export type ResolvedRate = { rate: string; rateDate: string; rateSource: string };
