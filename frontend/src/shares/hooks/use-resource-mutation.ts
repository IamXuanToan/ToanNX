"use client";

import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "./use-api-error-message";

/** Thông báo thành công chuẩn (`common.feedback`); `false` = không toast (form tự báo). */
export type MutationSuccessMessage = "saved" | "deleted" | "bulkUpdated" | "bulkDeleted" | false;

/**
 * Mutation chuẩn của mọi module: toast thành công theo loại, làm mới đúng các khóa đã khai (không làm mới
 * toàn bộ cache), lỗi thì toast thông báo đã dịch theo mã lỗi. Thay cho handler viết tay ở từng module.
 *
 * ```ts
 * useResourceMutation({
 *   mutationFn: (ids: string[]) => shortLinkService.bulkDelete(ids),
 *   invalidate: [shortLinkKeys.all],
 *   success: "bulkDeleted",
 * });
 * ```
 *
 * @param options - Hàm gọi API, khóa cần làm mới, loại thông báo, có toast lỗi hay không.
 * @returns Mutation của React Query.
 */
export function useResourceMutation<TVariables, TResult>({
  mutationFn,
  invalidate,
  success = "saved",
  toastError = true,
  onSuccess,
}: {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  /** Khóa hoặc danh sách các khóa cache cần làm mới khi mutation thành công. */
  invalidate: QueryKey | readonly QueryKey[];
  /** Thông báo chuẩn, hoặc hàm trả câu riêng của module (đã dịch) theo kết quả. */
  success?: MutationSuccessMessage | ((result: TResult) => string);
  /** Form tự hiện lỗi theo field thì đặt `false`. */
  toastError?: boolean;
  onSuccess?: (result: TResult, variables: TVariables) => unknown;
}) {
  const queryClient = useQueryClient();
  const t = useTranslations("common.feedback");
  const errorMessage = useApiErrorMessage();
  return useMutation({
    mutationFn,
    onSuccess: async (result, variables) => {
      if (typeof success === "function") {
        toast.success(success(result));
      } else if (success) {
        toast.success(t(success, { count: typeof result === "number" ? result : 0 }));
      }
      const invalidateKeys: readonly QueryKey[] =
        invalidate.length === 0
          ? []
          : Array.isArray(invalidate[0])
            ? (invalidate as readonly QueryKey[])
            : [invalidate as QueryKey];

      await Promise.all(
        invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
      await onSuccess?.(result, variables);
    },
    onError: toastError ? (error: unknown) => toast.error(errorMessage(error)) : undefined,
  });
}
