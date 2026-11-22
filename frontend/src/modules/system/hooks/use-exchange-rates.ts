"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { currencyKeys } from "../constants/query-keys";
import { exchangeRateService } from "../services/exchange-rate.service";
import type { ExchangeRateFilters } from "../types/currency.types";

/** @param filters - Bộ lọc. @returns Danh sách tỷ giá. */
export function useExchangeRates(filters: ExchangeRateFilters) {
  return useListQuery(currencyKeys.rates.list(filters), (signal) =>
    exchangeRateService.list(filters, signal),
  );
}
