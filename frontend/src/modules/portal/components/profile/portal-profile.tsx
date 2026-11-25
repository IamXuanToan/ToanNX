"use client";

import { Check, KeyRound, Loader2, Mail, Shield, User } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";
import { useUpdateProfile } from "@/modules/system/hooks/use-update-profile";
import { UserAvatar } from "@/shares/components/common/user-avatar";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/shares/components/ui/card";
import { Input } from "@/shares/components/ui/input";
import { Label } from "@/shares/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { useTabState } from "@/shares/hooks/use-tab-state";

type ProfileInfoForm = {
  fullName: string;
  username: string;
};

type PasswordForm = {
  password: string;
  confirmPassword: string;
};

/**
 * Component quản lý hồ sơ người dùng trong Client Portal.
 *
 * @returns Giao diện hồ sơ cá nhân.
 */
export function PortalProfile() {
  const t = useTranslations("portal.profile");
  const format = useFormatter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const user = currentUser?.user;

  const [activeTab, setActiveTab] = useTabState({
    validTabs: ["info", "password"] as const,
    defaultTab: "info",
  });

  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { isSubmitting: isSubmittingInfo },
  } = useForm<ProfileInfoForm>({
    values: {
      fullName: user?.fullName || "",
      username: user?.username || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { isSubmitting: isSubmittingPassword },
  } = useForm<PasswordForm>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSaveInfo = async (data: ProfileInfoForm) => {
    try {
      await updateProfile.mutateAsync({
        fullName: data.fullName.trim(),
        username: data.username.trim(),
      });
      toast.success(t("saveSuccess"));
    } catch {
      // Error handled by hook
    }
  };

  const onSavePassword = async (data: PasswordForm) => {
    if (data.password.length < 8) {
      toast.error(t("passwordTooShort"));
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    try {
      await updateProfile.mutateAsync({
        password: data.password,
      });
      resetPassword();
      toast.success(t("passwordChanged"));
    } catch {
      // Error handled by hook
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  const joinedAt = user.dateJoined ? new Date(user.dateJoined) : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-xl font-extrabold tracking-tight sm:text-2xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Cột trái: Card tóm tắt người dùng */}
        <div className="md:col-span-4">
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="flex flex-col items-center pt-6 text-center">
              <div className="relative mb-4">
                <UserAvatar
                  user={{
                    fullName: user.fullName,
                    avatarUrl: user.avatar?.url ?? undefined,
                  }}
                  className="size-24 text-2xl font-bold shadow-md"
                />
              </div>

              <h2 className="text-foreground text-base font-bold">
                {user.fullName || user.username}
              </h2>
              <p className="text-muted-foreground mt-0.5 text-xs">{user.email}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <Badge variant={user.isActive ? "default" : "destructive"} className="text-[10px]">
                  {user.isActive ? t("statusActive") : t("statusInactive")}
                </Badge>
                {user.isStaff ? (
                  <Badge variant="outline" className="text-[10px]">
                    Staff
                  </Badge>
                ) : null}
              </div>

              <div className="border-border/60 text-muted-foreground mt-6 w-full space-y-2 border-t pt-4 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span>{t("usernameLabel")}:</span>
                  <span className="text-foreground font-mono font-medium">{user.username}</span>
                </div>
                {joinedAt ? (
                  <div className="flex items-center justify-between">
                    <span>{t("joinedAt")}:</span>
                    <span className="text-foreground">
                      {format.dateTime(joinedAt, { dateStyle: "medium" })}
                    </span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Form thông tin & mật khẩu */}
        <div className="md:col-span-8">
          <Card className="border-border bg-card shadow-2xs">
            <CardHeader className="pb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info" className="gap-2 text-xs">
                    <User className="size-3.5" />
                    <span>{t("tabInfo")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="password" className="gap-2 text-xs">
                    <KeyRound className="size-3.5" />
                    <span>{t("tabPassword")}</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab Thông tin cá nhân */}
                <TabsContent value="info" className="pt-4">
                  <CardDescription className="mb-4 text-xs">{t("infoDescription")}</CardDescription>

                  <form onSubmit={handleSubmitInfo(onSaveInfo)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("fullName")}</Label>
                      <Input
                        {...registerInfo("fullName")}
                        placeholder={t("fullNamePlaceholder")}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("username")}</Label>
                      <Input
                        {...registerInfo("username")}
                        placeholder={t("usernamePlaceholder")}
                        className="h-9 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("email")}</Label>
                      <div className="relative">
                        <Input
                          value={user.email}
                          disabled
                          className="bg-muted text-muted-foreground h-9 text-xs"
                        />
                        <Mail className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-60" />
                      </div>
                      <p className="text-muted-foreground text-[11px]">{t("emailHint")}</p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmittingInfo}
                        className="h-9 gap-1.5 px-4 text-xs font-semibold"
                      >
                        {isSubmittingInfo ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        <span>{t("saveButton")}</span>
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* Tab Đổi mật khẩu */}
                <TabsContent value="password" className="pt-4">
                  <CardDescription className="mb-4 text-xs">
                    {t("passwordDescription")}
                  </CardDescription>

                  <form onSubmit={handleSubmitPassword(onSavePassword)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("newPassword")}</Label>
                      <Input
                        type="password"
                        {...registerPassword("password")}
                        placeholder={t("newPasswordPlaceholder")}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("confirmPassword")}</Label>
                      <Input
                        type="password"
                        {...registerPassword("confirmPassword")}
                        placeholder={t("confirmPasswordPlaceholder")}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmittingPassword}
                        className="h-9 gap-1.5 px-4 text-xs font-semibold"
                      >
                        {isSubmittingPassword ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Shield className="size-3.5" />
                        )}
                        <span>{t("updatePasswordButton")}</span>
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
