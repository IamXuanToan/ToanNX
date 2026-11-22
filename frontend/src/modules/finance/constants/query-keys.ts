import { createResourceKeys } from "@/shares/lib/api/resource-keys";

/** Phạm vi chung của query key module Tài chính (invalidate cả module bằng `financeKeys.all`). */
export const FINANCE_SCOPE = "finance";

/** Query key của module Tài chính. */
export const financeKeys = {
  all: [FINANCE_SCOPE] as const,
  incomes: createResourceKeys(FINANCE_SCOPE, "incomes"),
  invoices: createResourceKeys(FINANCE_SCOPE, "invoices"),
  platforms: createResourceKeys(FINANCE_SCOPE, "platforms"),
  rules: createResourceKeys(FINANCE_SCOPE, "rules"),
  taxRates: (platformId: string) => [FINANCE_SCOPE, "tax-rates", platformId] as const,
  taxRateResolve: (platformId: string, date: string) =>
    [FINANCE_SCOPE, "tax-rate", platformId, date] as const,
  reportSummary: (filters: object) => [FINANCE_SCOPE, "report-summary", filters] as const,
  reportMonthly: (year: number) => [FINANCE_SCOPE, "report-monthly", year] as const,
  sepay: () => [FINANCE_SCOPE, "sepay"] as const,
};
