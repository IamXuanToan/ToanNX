"use client";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { useFinanceRoutes } from "../../../hooks/use-finance-routes";
import { useBulkDeleteIncomes } from "../../../hooks/use-bulk-delete-incomes";
import { useDeleteIncome } from "../../../hooks/use-delete-income";
import { useIncomes } from "../../../hooks/use-incomes";
import { useOwnerFilterOptions } from "../../../hooks/use-owner-filter-options";
import { usePlatformOptions } from "../../../hooks/use-platform-options";
import { useRecalculateIncomeTax } from "../../../hooks/use-recalculate-income-tax";
import { useReclassifyIncomes } from "../../../hooks/use-reclassify-incomes";
import { INCOME_PERMISSIONS } from "../../../permissions/income-permission";
import type { Income, IncomeFilters } from "../../../types/income.types";

const FILTER_KEYS = [
  "owner",
  "platform",
  "taxStatus",
  "source",
  "currency",
  "needsReview",
  "hasInvoice",
  "year",
  "month",
] as const;

/**
 * State bảng giao dịch: lọc theo nền tảng/trạng thái thuế/nguồn/tiền tệ/cần xử lý/có chứng từ, năm/tháng
 * (báo cáo truyền sẵn `scope`), thao tác hàng loạt nhận diện lại, tính lại khấu trừ, xóa.
 *
 * @param scope - Bộ lọc cố định (báo cáo năm/tháng).
 * @returns Truy vấn, state bảng, handler.
 */
export function useIncomeTable(scope: IncomeFilters = {}) {
  const router = useRouter();
  const routes = useFinanceRoutes();
  const table = useTableState({ ordering: "-received_at", filterKeys: FILTER_KEYS });
  const extra = table.extraFilters;
  const filters: IncomeFilters = {
    ...table.filters,
    owner: extra.owner,
    platform: extra.platform,
    taxStatus: extra.taxStatus,
    source: extra.source,
    currency: extra.currency,
    needsReview: extra.needsReview ? extra.needsReview === "true" : undefined,
    hasInvoice: extra.hasInvoice ? extra.hasInvoice === "true" : undefined,
    year: extra.year ? Number(extra.year) : undefined,
    month: extra.month ? Number(extra.month) : undefined,
    ...scope,
  };
  const query = useIncomes(filters);
  const platforms = usePlatformOptions();
  const ownerFilter = useOwnerFilterOptions(INCOME_PERMISSIONS.manageAll);
  const remove = useDeleteIncome();
  const bulkDelete = useBulkDeleteIncomes();
  const reclassify = useReclassifyIncomes();
  const recalculate = useRecalculateIncomeTax();
  const ids = (rows: Income[]) => rows.map((row) => row.id);
  return {
    table,
    query,
    filters,
    canManageAll: ownerFilter.canManageAll,
    canFilterOwner: ownerFilter.canFilterOwner,
    ownerOptions: ownerFilter.ownerOptions,
    yearOptions: Array.from({ length: 6 }, (_, index) => {
      const value = String(new Date().getFullYear() - index);
      return { value, label: value };
    }),
    platformOptions: (platforms.data ?? []).map((platform) => ({
      value: platform.id,
      label: platform.name,
    })),
    view: (income: Income) => router.push(routes.incomeDetail(income.id)),
    edit: (income: Income) => router.push(withEditMode(routes.incomeDetail(income.id))),
    remove: (income: Income) => remove.mutateAsync(income.id),
    bulkDelete: (rows: Income[]) => bulkDelete.mutateAsync(ids(rows)),
    reclassify: (rows: Income[]) => reclassify.mutateAsync(ids(rows)),
    recalculate: (rows: Income[]) => recalculate.mutateAsync({ ids: ids(rows) }),
  };
}
