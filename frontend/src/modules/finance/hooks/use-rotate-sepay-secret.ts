"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { sepayConnectionService } from "../services/sepay-connection.service";
import type { SepayStatus } from "../types/sepay.types";

/** @returns Mutation tạo secret webhook mới. */
export function useRotateSepaySecret() {
  return useResourceMutation<void, SepayStatus>({
    mutationFn: () => sepayConnectionService.rotateSecret(),
    invalidate: [financeKeys.all],
    success: "saved",
  });
}
