"use client";

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { currencyKeys } from "../../../constants/query-keys";
import { currencyService } from "../../../services/currency.service";
import { SYSTEM_ROUTES } from "../../../constants/routes";
import { useCurrencies } from "../../../hooks/use-currencies";
import { useDeleteCurrency } from "../../../hooks/use-delete-currency";
import type { Currency } from "../../../types/currency.types";

/** @returns State bảng tiền tệ. */
export function useCurrencyTable() {
  const router = useRouter();
  const table = useTableState({ ordering: "position" });
  const query = useCurrencies(table.filters);
  const remove = useDeleteCurrency();
  const bulk = useBulkActions<Currency>({
    service: currencyService,
    invalidate: [currencyKeys.currencies.all],
  });
  return {
    bulkDelete: bulk.bulkDelete,
    bulkSetActive: (rows: Currency[], value: boolean) => bulk.bulkUpdate(rows, { isActive: value }),
    table,
    query,
    view: (row: Currency) => router.push(SYSTEM_ROUTES.currencyDetail(row.id)),
    edit: (row: Currency) => router.push(withEditMode(SYSTEM_ROUTES.currencyDetail(row.id))),
    remove: (row: Currency) => remove.mutateAsync(row.id),
  };
}
