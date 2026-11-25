"use client";

import { useQuery } from "@tanstack/react-query";

import { usePermission } from "./use-permission";
import { CURRENCY_PERMISSIONS } from "../permissions/currency-permission";
import { currencyKeys } from "../constants/query-keys";
import { currencyService } from "../services/currency.service";

/** @returns Mọi tiền tệ (ô chọn), tiền tệ gốc trước. */
export function useCurrencyOptions(enabled = true) {
  const canRead = usePermission(CURRENCY_PERMISSIONS.read);
  return useQuery({
    queryKey: currencyKeys.currencies.options(),
    queryFn: ({ signal }) => currencyService.listAll({ ordering: "position" }, signal),
    staleTime: 300_000,
    enabled: enabled && canRead,
  });
}
