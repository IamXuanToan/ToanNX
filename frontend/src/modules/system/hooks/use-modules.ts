"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { attachmentRepository } from "@/modules/attachment/repositories/attachment.repository";
import { authKeys, systemKeys } from "@/shares/constants/query-keys";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { systemRepository } from "../repositories/system.repository";
import type { ModuleUpdateInput } from "../types/system.types";

/** @returns Truy vấn danh sách module. */
export function useModules() {
  return useQuery({
    queryKey: systemKeys.modules(),
    queryFn: ({ signal }) => systemRepository.listModules(signal),
  });
}

/**
 * Callback dùng chung: toast, làm mới danh sách module và `/auth/me` (sidebar, dashboard dùng icon/module).
 *
 * @returns Handler onSuccess/onError.
 */
function useModuleMutationHandlers() {
  const queryClient = useQueryClient();
  const t = useTranslations("system.feedback");
  const errorMessage = useApiErrorMessage();
  return {
    onSuccess: async () => {
      toast.success(t("saved"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: systemKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.me() }),
      ]);
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  };
}

/** @returns Mutation cập nhật module (bật/tắt, icon lucide, gỡ icon SVG). */
export function useUpdateModule() {
  return useMutation({
    mutationFn: ({ code, input }: { code: string; input: ModuleUpdateInput }) =>
      systemRepository.updateModule(code, input),
    ...useModuleMutationHandlers(),
  });
}

/** @returns Mutation upload file SVG rồi đặt làm icon module. */
export function useUploadModuleIcon() {
  return useMutation({
    mutationFn: async ({ code, file }: { code: string; file: File }) => {
      const attachment = await attachmentRepository.upload(file);
      return systemRepository.updateModule(code, { iconId: attachment.id });
    },
    ...useModuleMutationHandlers(),
  });
}
