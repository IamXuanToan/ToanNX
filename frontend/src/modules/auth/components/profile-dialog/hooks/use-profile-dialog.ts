"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  getUserDisplayName,
  getUserInitials,
} from "@/shares/components/common/user-avatar/user-avatar";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useUpdateProfile } from "../../../hooks/use-update-profile";
import {
  createProfileInfoSchema,
  createProfilePasswordSchema,
  type ProfileInfoFormValues,
  type ProfilePasswordFormValues,
} from "../../../schemas/profile.schema";
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
}: {
  user: AuthUser | undefined;
  roles?: AuthRole[];
  open: boolean;
}) {
  const t = useTranslations("auth.profile");
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [libraryOpen, setLibraryOpen] = useState(false);

  const updateProfile = useUpdateProfile();
  const errorMessage = useApiErrorMessage();

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
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
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
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
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
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
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
  };
}
