"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { AUTH_WORKSPACE_PATHS } from "../../../constants/auth-storage";
import { authKeys } from "../../../constants/query-keys";
import {
  createInvitationSchema,
  type InvitationFormValues,
} from "../../../schemas/invitation.schema";
import { authService } from "../../../services/auth.service";
import type { InvitationValidateResponse } from "../../../types/auth.types";

/**
 * Hook quản lý trạng thái và thao tác thiết lập tài khoản từ lời mời:
 * - Kiểm tra tính hợp lệ của token khi tải trang.
 * - Điền trước họ tên hoặc username nếu quản trị viên đã nhập trước đó.
 * - Gửi form hoàn tất kích hoạt và tự động đăng nhập vào hệ thống.
 *
 * @returns State kiểm tra token, form react-hook-form và handler submit.
 */
export function useInvitationForm() {
  const t = useTranslations("system.auth.invitation");
  const tValidation = useTranslations("system.auth.invitation.validation");
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const errorMessage = useApiErrorMessage();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationValidateResponse | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const schema = useMemo(() => createInvitationSchema(tValidation), [tValidation]);

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    let active = true;

    async function checkToken() {
      if (!token) {
        if (active) {
          setTokenError(t("tokenMissing"));
          setIsValidatingToken(false);
        }
        return;
      }

      try {
        const data = await authService.validateInvitationToken(token);
        if (active) {
          setInvitationData(data);
          form.reset({
            fullName: data.fullName ?? "",
            username: data.username ?? "",
            password: "",
            confirmPassword: "",
          });
        }
      } catch (error) {
        if (active) {
          setTokenError(errorMessage(error));
        }
      } finally {
        if (active) {
          setIsValidatingToken(false);
        }
      }
    }

    void checkToken();

    return () => {
      active = false;
    };
  }, [token, errorMessage, form, t]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!token) return;
    setIsSubmitting(true);
    setRootError(null);

    try {
      const result = await authService.acceptInvitation({
        token,
        fullName: values.fullName.trim(),
        username: values.username?.trim() || undefined,
        password: values.password,
      });

      queryClient.setQueryData(authKeys.me(), result);
      toast.success(t("welcomeSuccess", { name: result.user.fullName || result.user.email }));

      const targetPath: AppPathname = result.user.isStaff
        ? AUTH_WORKSPACE_PATHS.admin
        : AUTH_WORKSPACE_PATHS.home;
      router.replace(targetPath);
    } catch (error) {
      setRootError(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    t,
    token,
    isValidatingToken,
    invitationData,
    tokenError,
    form,
    onSubmit,
    isSubmitting,
    rootError,
  };
}
