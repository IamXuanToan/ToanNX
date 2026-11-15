"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { authKeys } from "../constants/query-keys";
import { adminAuthSessionService } from "../services/admin-auth-session.service";
import type { AdminSessionFilters } from "../types/admin-session.types";

/** @param filters - Bộ lọc đã áp dụng. @returns Truy vấn phiên của mọi người dùng. */
export function useAdminSessions(filters: AdminSessionFilters) {
  return useQuery({
    queryKey: authKeys.adminSessions(filters),
    queryFn: ({ signal }) => adminAuthSessionService.list(filters, signal),
    placeholderData: keepPreviousData,
  });
}

/** @returns Mutation thu hồi phiên, thông báo kết quả và làm mới danh sách. */
export function useRevokeAdminSession() {
  const queryClient = useQueryClient();
  const t = useTranslations("auth.sessions");
  const errorMessage = useApiErrorMessage();
  return useMutation({
    mutationFn: (id: string) => adminAuthSessionService.revoke(id),
    onSuccess: async () => {
      toast.success(t("revoked"));
      await queryClient.invalidateQueries({ queryKey: authKeys.adminSessions() });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
}

/** @returns Mutation thu hồi nhiều phiên, thông báo số phiên đã thu hồi và làm mới danh sách. */
export function useBulkRevokeAdminSessions() {
  const queryClient = useQueryClient();
  const t = useTranslations("auth.sessions");
  const errorMessage = useApiErrorMessage();
  return useMutation({
    mutationFn: (ids: string[]) => adminAuthSessionService.bulkRevoke(ids),
    onSuccess: async (count) => {
      toast.success(t("bulkRevoked", { count }));
      await queryClient.invalidateQueries({ queryKey: authKeys.adminSessions() });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
}

/** @returns Mutation xóa mềm phiên và làm mới danh sách. */
export function useDeleteAdminSessions() {
  const queryClient = useQueryClient();
  const t = useTranslations("common.feedback");
  const errorMessage = useApiErrorMessage();
  return useMutation({
    mutationFn: (ids: string[]) => adminAuthSessionService.bulkDelete(ids),
    onSuccess: async (count) => {
      toast.success(t("bulkDeleted", { count }));
      await queryClient.invalidateQueries({ queryKey: authKeys.adminSessions() });
      await queryClient.invalidateQueries({ queryKey: authKeys.adminSessionUsers() });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
}
