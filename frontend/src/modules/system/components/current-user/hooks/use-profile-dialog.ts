"use client";

import type { ProfileTab } from "../../../types/profile-tab.types";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { getUserDisplayName, getUserInitials } from "@/shares/components/common/user-avatar";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";
import { toast } from "sonner";

import {
  OAUTH_MODE,
  OAUTH_STORAGE_KEYS,
  PROFILE_DIALOG_QUERY,
} from "../../../constants/auth-storage";
import { authKeys } from "../../../constants/query-keys";
import { useUpdateProfile } from "../../../hooks/use-update-profile";
import {
  createProfileInfoSchema,
  createProfilePasswordSchema,
  type ProfileInfoFormValues,
  type ProfilePasswordFormValues,
} from "../../../schemas/profile.schema";
import { authService } from "../../../services/auth.service";
import type { AuthRole, AuthUser } from "../../../types/auth.types";

/**
 * Hook điều khiển toàn bộ logic cho dialog hồ sơ cá nhân:
 * - Form thông tin chung (Họ tên, username, email)
 * - Form đổi mật khẩu riêng biệt
 * - Chọn ảnh đại diện từ Thư viện hoặc gỡ ảnh
 * - Hiển thị vai trò và hoạt động đăng nhập
 *
 * @param params - Thông tin người dùng, roles và trạng thái mở dialog.
 * @returns Toàn bộ state và handler cho dialog.
 */
export function useProfileDialog({
  user,
  roles = [],
  open,
  urlMode = "dialog",
}: {
  user: AuthUser | undefined;
  roles?: AuthRole[];
  open: boolean;
  urlMode?: "dialog" | "page";
}) {
  const t = useTranslations("system.auth.profile");
  const searchParams = useSearchParams();
  const isProfileOpenInUrl =
    urlMode === "page" ||
    searchParams?.get(PROFILE_DIALOG_QUERY.openParam) === PROFILE_DIALOG_QUERY.openValue;
  const rawTabParam = isProfileOpenInUrl
    ? (searchParams?.get(PROFILE_DIALOG_QUERY.tabParam) ??
      (urlMode === "page" ? searchParams?.get("tab") : null))
    : null;
  const tabParam = rawTabParam === "password" ? "security" : rawTabParam;
  const validTab =
    tabParam === "security" ||
    tabParam === "social" ||
    tabParam === "info" ||
    tabParam === "notifications"
      ? tabParam
      : "info";
  const [prevParam, setPrevParam] = useState(validTab);
  const [selectedTab, setSelectedTab] = useState<ProfileTab>(validTab);

  if (prevParam !== validTab) {
    setPrevParam(validTab);
    setSelectedTab(validTab);
  }

  const activeTab = selectedTab;

  const setActiveTab = (tab: ProfileTab) => {
    setSelectedTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (urlMode === "dialog") {
        url.searchParams.set(PROFILE_DIALOG_QUERY.openParam, PROFILE_DIALOG_QUERY.openValue);
      }
      url.searchParams.set(PROFILE_DIALOG_QUERY.tabParam, tab);
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  };
  const [libraryOpen, setLibraryOpen] = useState(false);

  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const errorMessage = useApiErrorMessage();

  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const {
    data: socialAccounts = [],
    isLoading: isLoadingSocials,
    refetch: refetchSocials,
  } = useQuery({
    queryKey: authKeys.socialAccounts(),
    queryFn: ({ signal }) => authService.listSocialAccounts(signal),
    enabled: open,
  });

  const handleRequestUnlink = (provider: string) => {
    setUnlinkProvider(provider);
  };

  const handleCancelUnlink = () => {
    setUnlinkProvider(null);
  };

  const handleConfirmUnlink = async () => {
    if (!unlinkProvider) return;
    setIsUnlinking(true);
    try {
      await authService.unlinkSocialAccount(unlinkProvider);
      toast.success(t("socialUnlinkSuccess"));
      void refetchSocials();
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsUnlinking(false);
      setUnlinkProvider(null);
    }
  };

  const handleLink = async (provider: string) => {
    if (connectingProvider) return;
    setConnectingProvider(provider);
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem(OAUTH_STORAGE_KEYS.state, state);
      sessionStorage.setItem(OAUTH_STORAGE_KEYS.mode, OAUTH_MODE.link);
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const res = await authService.getSocialAuthUrl(provider, state, redirectUri);
      const safeAuthUrl = toSafeHttpUrl(res.authorizationUrl, { allowRelative: false });
      if (!safeAuthUrl) {
        setConnectingProvider(null);
        return;
      }
      window.location.href = safeAuthUrl;
    } catch (error) {
      toast.error(errorMessage(error));
      setConnectingProvider(null);
    }
  };

  useEffect(() => {
    if (verificationCooldown <= 0) return;
    const timer = setInterval(() => {
      setVerificationCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [verificationCooldown]);

  const handleSendVerificationEmail = async () => {
    if (isSendingVerification || verificationCooldown > 0) return;
    setIsSendingVerification(true);
    try {
      await authService.sendVerificationEmail();
      setVerificationCooldown(60);
      toast.success(t("verificationSentSuccess"));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsSendingVerification(false);
    }
  };

  const infoSchema = useMemo(
    () =>
      createProfileInfoSchema((key) => {
        return t(key);
      }),
    [t],
  );

  const passwordSchema = useMemo(
    () =>
      createProfilePasswordSchema((key) => {
        return t(key);
      }),
    [t],
  );

  const infoForm = useForm<ProfileInfoFormValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      email: user?.email ?? "",
      username: user?.username ?? "",
      fullName: user?.fullName ?? "",
    },
    mode: "onTouched",
  });

  const passwordForm = useForm<ProfilePasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  // Đồng bộ form khi mở dialog hoặc user thay đổi
  useEffect(() => {
    if (open && user) {
      infoForm.reset({
        email: user.email ?? "",
        username: user.username ?? "",
        fullName: user.fullName ?? "",
      });
      passwordForm.reset({
        password: "",
        confirmPassword: "",
      });
    }
  }, [open, user, infoForm, passwordForm]);

  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const initials = useMemo(() => getUserInitials(user), [user]);

  const onSaveInfo = infoForm.handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({
        email: values.email.trim(),
        username: values.username.trim(),
        fullName: values.fullName.trim(),
      });
    } catch (error) {
      infoForm.setError("root", { message: errorMessage(error) });
    }
  });

  const onSavePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({
        password: values.password,
      });
      passwordForm.reset({ password: "", confirmPassword: "" });
    } catch (error) {
      passwordForm.setError("root", { message: errorMessage(error) });
    }
  });

  const handleSelectAvatar = async (file: { id: string; url: string }) => {
    try {
      await updateProfile.mutateAsync({ avatarId: file.id });
    } catch (error) {
      infoForm.setError("root", { message: errorMessage(error) });
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile.mutateAsync({ avatarId: null });
    } catch (error) {
      infoForm.setError("root", { message: errorMessage(error) });
    }
  };

  const isSaving = updateProfile.isPending;

  return {
    t,
    user,
    roles,
    displayName,
    initials,
    activeTab,
    setActiveTab,
    libraryOpen,
    setLibraryOpen,
    infoForm,
    passwordForm,
    onSaveInfo,
    onSavePassword,
    handleSelectAvatar,
    handleRemoveAvatar,
    isSaving,
    verificationCooldown,
    isSendingVerification,
    handleSendVerificationEmail,
    socialAccounts,
    isLoadingSocials,
    unlinkProvider,
    isUnlinking,
    connectingProvider,
    handleRequestUnlink,
    handleConfirmUnlink,
    handleCancelUnlink,
    handleLink,
  };
}
