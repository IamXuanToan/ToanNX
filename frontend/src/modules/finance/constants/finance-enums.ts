/** Giá trị enum khớp BE (`Income.TaxStatus`, `RateSource`, `Invoice.DocType`...). */
export const TAX_STATUSES = [
  "WITHHELD",
  "NOT_WITHHELD",
  "NO_RATE",
  "UNCLASSIFIED",
  "PENDING",
] as const;
export const INCOME_SOURCES = ["MANUAL", "SEPAY"] as const;
export const RATE_SOURCES = ["BASE", "API", "MANUAL", "BANK_ACTUAL"] as const;
export const MANUAL_RATE_SOURCES = ["API", "MANUAL"] as const;
export const DOC_TYPES = [
  "WITHHOLDING_CERTIFICATE",
  "INVOICE",
  "STATEMENT",
  "CONTRACT",
  "OTHER",
] as const;
export const PREVIEW_STATUSES = ["NEW", "EXISTS", "CHANGED", "INVALID"] as const;
