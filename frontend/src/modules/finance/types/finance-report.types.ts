/** Các tổng của báo cáo (VNĐ, chuỗi số nguyên). */
export type ReportTotals = {
  count: number;
  total: string;
  withheld: string;
  tax: string;
  notWithheld: string;
  unclassified: string;
};

export type ReportMonth = ReportTotals & { month: number };

export type ReportPlatformRow = ReportTotals & {
  platformId: string | null;
  platform: string;
  taxWithheld: boolean;
  taxRate: string;
};

export type ReportCurrencyRow = {
  currency: string;
  symbol: string;
  decimalPlaces: number;
  count: number;
  original: string;
  total: string;
};

/** BE `ReportSummaryResponseSerializer`. */
export type ReportSummary = {
  year: number;
  month: number | null;
  totals: ReportTotals & { needsReview: number };
  byPlatform: ReportPlatformRow[];
  byMonth: ReportMonth[];
  byCurrency: ReportCurrencyRow[];
};

/** BE `ReportMonthlyResponseSerializer` (dashboard). */
export type ReportMonthly = {
  year: number;
  months: ReportMonth[];
  previousMonths: ReportMonth[];
  byPlatform: { month: number; platform: string; total: string }[];
};
