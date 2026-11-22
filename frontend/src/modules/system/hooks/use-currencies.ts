"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";
import type { ListParams } from "@/shares/types/api.types";

import { currencyKeys } from "../constants/query-keys";
import { currencyService } from "../services/currency.service";

/** @param filters - Bộ lọc. @returns Danh sách tiền tệ. */
export function useCurrencies(filters: ListParams) {
  return useListQuery(currencyKeys.currencies.list(filters), (signal) =>
    currencyService.list(filters, signal),
  );
}
