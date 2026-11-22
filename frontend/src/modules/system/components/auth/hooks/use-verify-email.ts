"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { authService } from "../../../services/auth.service";

/**
 * Hook xử lý logic trang xác minh địa chỉ email qua token:
 * - Lấy token từ searchParams.
 * - Tự động gọi API `POST /system/auth/verify-email`.
 * - Quản lý trạng thái đang xử lý (loading), thành công hoặc lỗi chi tiết.
 *
 * @returns Trạng thái loading, error, success và hàm thử lại.
 */
export function useVerifyEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const t = useTranslations("system.auth.verifyEmail");
  const errorMessage = useApiErrorMessage();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const executedRef = useRef(false);

  const handleVerify = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setErrorText(t("invalidToken"));
      return;
    }

    setIsLoading(true);
    setErrorText(null);
    try {
      await authService.verifyEmail({ token });
      setIsSuccess(true);
    } catch (error) {
      setErrorText(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [token, errorMessage, t]);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;
    void handleVerify();
  }, [handleVerify]);

  return {
    t,
    token,
    isLoading,
    isSuccess,
    errorText,
    handleRetry: handleVerify,
  };
}
