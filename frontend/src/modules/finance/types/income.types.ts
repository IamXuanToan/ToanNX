import type { ListParams } from "@/shares/types/api.types";

import type {
  INCOME_SOURCES,
  MANUAL_RATE_SOURCES,
  RATE_SOURCES,
  TAX_STATUSES,
} from "../constants/finance-enums";

export type TaxStatus = (typeof TAX_STATUSES)[number];
export type IncomeSource = (typeof INCOME_SOURCES)[number];
export type RateSource = (typeof RATE_SOURCES)[number];
export type ManualRateSource = (typeof MANUAL_RATE_SOURCES)[number];

/** Giao dịch thu nhập (BE `IncomeResponseSerializer`); tiền là chuỗi Decimal. */
export type Income = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  source: IncomeSource;
  receivedAt: string;
  receivedDate: string;
  content: string;
  note: string;
  currencyId: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDecimalPlaces: number;
  originalAmount: string | null;
  exchangeRate: string;
  rateSource: RateSource;
  rateDate: string | null;
  amount: string | null;
  amountStatus: "OK" | "UNKNOWN";
  platformId: string | null;
  platformName: string | null;
  matchedRuleId: string | null;
  matchedRuleName: string | null;
  isPlatformLocked: boolean;
  taxWithheld: boolean;
  taxRate: string;
  taxAmount: string | null;
  grossAmount: string | null;
  isTaxManual: boolean;
  taxStatus: TaxStatus;
  referenceCode: string;
  bankName: string;
  accountLast4: string;
  invoiceIds: string[];
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Bộ lọc danh sách (giá trị nhiều lựa chọn gửi dạng `a,b`). */
export type IncomeFilters = ListParams & {
  year?: number;
  month?: number;
  owner?: string;
  platform?: string;
  taxStatus?: string;
  source?: string;
  currency?: string;
  needsReview?: boolean;
  hasInvoice?: boolean;
  amountStatus?: string;
  date?: string;
  amount?: string;
};

/** Dữ liệu nhập tay / sửa (BE `IncomeValidateSerializer`). */
export type IncomeInput = {
  receivedAt?: string;
  platformId?: string | null;
  currencyId?: string;
  originalAmount?: string;
  rateSource?: ManualRateSource;
  exchangeRate?: string | null;
  content?: string;
  note?: string;
  isTaxManual?: boolean;
  taxWithheld?: boolean;
  taxRate?: string;
  taxAmount?: string | null;
};
