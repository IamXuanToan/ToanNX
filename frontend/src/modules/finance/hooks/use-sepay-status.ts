"use client";

import { useQuery } from "@tanstack/react-query";

import { financeKeys } from "../constants/query-keys";
import { sepayConnectionService } from "../services/sepay-connection.service";

/** @returns Trạng thái kết nối SePay của mình. */
export function useSepayStatus() {
  return useQuery({
    queryKey: financeKeys.sepay(),
    queryFn: ({ signal }) => sepayConnectionService.status(signal),
  });
}
