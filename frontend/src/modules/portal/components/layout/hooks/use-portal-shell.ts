"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { SYSTEM_ROUTES } from "@/modules/system/constants/routes";
import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { SESSION_EXPIRED_TOAST_ID } from "@/shares/constants/auth-session";
import { isApiError } from "@/shares/lib/api/api-error";
import { useAuthStore } from "@/store/auth-store";

/**
 * Logic khung Client Portal: kiểm tra phiên đăng nhập và tự động chuyển về trang đăng nhập khi chưa đăng nhập
 * hoặc phiên hết hạn (tương đồng với `useAdminShell`).
 *
 * @returns Trạng thái tải (`loading` | `error` | `ready`) và hàm thử lại.
 */
export function usePortalShell() {
  const t = useTranslations("system.auth.session");
  const queryClient = useQueryClient();
  const router = useRouter();
  const current = useCurrentUser();
  const sessionExpired = useAuthStore((state) => state.sessionExpired);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);
  const resetSession = useAuthStore((state) => state.resetSession);

  const unauthenticated =
    (isApiError(current.error) && current.error.status === 401) ||
    (!current.isPending && !current.isError && !current.data?.user);

  useEffect(() => {
    if (isLoggingOut) return;
    if (!sessionExpired && !unauthenticated) return;
    if (sessionExpired) {
      toast.warning(t("expired"), { id: SESSION_EXPIRED_TOAST_ID });
    }
    queryClient.clear();
    resetSession();
    router.replace({
      pathname: SYSTEM_ROUTES.login,
      query: { next: window.location.pathname + window.location.search },
    });
  }, [sessionExpired, unauthenticated, isLoggingOut, queryClient, resetSession, router, t]);

  const status: "loading" | "error" | "ready" =
    current.isPending || unauthenticated ? "loading" : current.isError ? "error" : "ready";

  return {
    status,
    refetch: current.refetch,
  };
}
