"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { financeKeys } from "../constants/query-keys";
import { sepayConnectionService } from "../services/sepay-connection.service";

/** @returns Mutation kiểm token (trả số tài khoản). */
export function useTestSepayConnection() {
  return useResourceMutation<void, number>({
    mutationFn: () => sepayConnectionService.test(),
    invalidate: [financeKeys.all],
    success: false,
  });
}
