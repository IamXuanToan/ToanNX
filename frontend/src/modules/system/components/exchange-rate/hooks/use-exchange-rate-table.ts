"use client";

import { useTableState } from "@/shares/hooks/use-table-state";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { currencyKeys } from "../../../constants/query-keys";
import { exchangeRateService } from "../../../services/exchange-rate.service";
import { useCurrencyOptions } from "../../../hooks/use-currency-options";
import { useDeleteExchangeRate } from "../../../hooks/use-delete-exchange-rate";
import { useExchangeRates } from "../../../hooks/use-exchange-rates";
import type { ExchangeRate } from "../../../types/currency.types";

/** @returns State bảng tỷ giá (lọc tiền tệ, nguồn). */
export function useExchangeRateTable() {
  const table = useTableState({ ordering: "-rate_date", filterKeys: ["currency", "source"] });
  const query = useExchangeRates({
    ...table.filters,
    currency: table.extraFilters.currency,
    source: table.extraFilters.source,
  });
  const currencies = useCurrencyOptions();
  const remove = useDeleteExchangeRate();
  const bulk = useBulkActions<ExchangeRate>({
    service: exchangeRateService,
    invalidate: [currencyKeys.rates.all],
  });
  return {
    bulkDelete: bulk.bulkDelete,
    table,
    query,
    currencyOptions: (currencies.data ?? [])
      .filter((item) => !item.isBase)
      .map((item) => ({ value: item.id, label: item.code })),
    remove: (row: ExchangeRate) => remove.mutateAsync(row.id),
  };
}
