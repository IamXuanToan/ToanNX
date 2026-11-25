import type { ListParams } from "@/shares/types/api.types";

import type { DOC_TYPES } from "../constants/finance-enums";
import type { ManualRateSource, RateSource } from "./income.types";
import type { InvoiceAttachment } from "./invoice-attachment.types";

export type DocType = (typeof DOC_TYPES)[number];

/** Hóa đơn / chứng từ (BE `InvoiceResponseSerializer`). */
export type Invoice = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  docType: DocType;
  number: string;
  issuer: string;
  issuerTaxCode: string;
  issuedOn: string;
  periodFrom: string | null;
  periodTo: string | null;
  platformId: string | null;
  platformName: string | null;
  currencyId: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDecimalPlaces: number;
  originalAmount: string;
  originalTaxAmount: string | null;
  exchangeRate: string;
  rateSource: RateSource;
  rateDate: string | null;
  amount: string;
  taxAmount: string | null;
  attachments: InvoiceAttachment[];
  incomeIds: string[];
  reconciliation: {
    incomeCount: number;
    incomeAmount: string;
    incomeTaxAmount: string;
    incomeGrossAmount: string;
    grossDifference: string;
    taxDifference: string;
  };
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceFilters = ListParams & {
  year?: number;
  owner?: string;
  docType?: string;
  platform?: string;
};

/** Dữ liệu tạo/sửa (BE `InvoiceValidateSerializer`). */
export type InvoiceInput = {
  docType?: DocType;
  number?: string;
  issuer?: string;
  issuerTaxCode?: string;
  issuedOn?: string;
  periodFrom?: string | null;
  periodTo?: string | null;
  platformId?: string | null;
  currencyId?: string;
  originalAmount?: string;
  originalTaxAmount?: string | null;
  rateSource?: ManualRateSource;
  exchangeRate?: string | null;
  attachmentIds?: string[];
  incomeIds?: string[];
  note?: string;
};
