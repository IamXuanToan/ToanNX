"use client";

import {
  AlertCircle,
  Bell as BellIcon,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Images,
  KeyRound,
  Link2,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { AttachmentPicker } from "@/modules/system/components/attachment/attachment-picker";
import { NotificationSettingsTab } from "@/modules/system/components/notification-preference/notification-settings-tab";
import {
  NOTIFICATION_PREFERENCES_FORM_ID,
  PROFILE_INFO_FORM_ID,
  PROFILE_PASSWORD_FORM_ID,
} from "@/modules/system/constants/profile-forms";
import type { ProfileTab } from "@/modules/system/types/profile-tab.types";
import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { EmailInput } from "@/shares/components/common/email-input";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { PasswordInput } from "@/shares/components/common/password-input";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { UserAvatar } from "@/shares/components/common/user-avatar";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/shares/components/ui/card";
import { Input } from "@/shares/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";
import { ICON_PATHS } from "@/shares/lib/asset-paths";

import { usePortalProfile } from "./hooks/use-portal-profile";

const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google", description: "Accounts Google (OAuth 2.0)" },
  { id: "github", label: "GitHub", description: "GitHub OAuth App" },
] as const;

/**
 * Component quản lý hồ sơ người dùng trong Client Portal theo bố cục 2 cột cân đối:
 * - Cột trái: Thẻ định danh người dùng (avatar + nút đổi/gỡ ảnh, trạng thái xác minh email, vai trò, hoạt động).
 * - Cột phải: Thẻ cấu hình theo tab (Thông tin cá nhân, Bảo mật/Đổi mật khẩu, Tài khoản liên kết, Thông báo).
 *
 * @returns Giao diện hồ sơ cá nhân.
 */
export function PortalProfile() {
  const tPortal = useTranslations("portal.profile");
  const tPreferences = useTranslations("system.notifications.preferences");

  const {
    t,
    user,
    isLoading,
    displayName,
    allRoles,
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
    unlinkProvider,
    isUnlinking,
    connectingProvider,
    handleRequestUnlink,
    handleConfirmUnlink,
    handleCancelUnlink,
    handleLink,
    canPreferences,
    canPreferenceUpdate,
    canNotifications,
    canReadAttachments,
    canUploadAttachments,
  } = usePortalProfile();

  if (isLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  const infoErrors = infoForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Tiêu đề trang */}
      <div className="space-y-1">
        <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* CỘT TRÁI: Thẻ định danh, ảnh đại diện, vai trò và hoạt động */}
        <div className="lg:sticky lg:top-20">
          <Card className="border-border bg-card shadow-2xs">
            <CardContent className="space-y-5 pt-6">
              {/* Avatar + nút chọn/gỡ ảnh */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <UserAvatar
                    user={user}
                    size="lg"
                    className="ring-background size-24 text-2xl font-bold shadow-md ring-4"
                  />
                  {isSaving ? (
                    <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full backdrop-blur-xs">
                      <Loader2 className="text-primary size-6 animate-spin" aria-hidden />
                    </div>
                  ) : null}
                </div>

                {canReadAttachments || user.avatar ? (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {canReadAttachments ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-lg text-xs font-medium"
                        onClick={() => setLibraryOpen(true)}
                        disabled={isSaving}
                        data-testid="portal-profile-open-library-button"
                      >
                        <Images className="size-3.5" aria-hidden />
                        <span>{t("avatarLibrary")}</span>
                      </Button>
                    ) : null}

                    {user.avatar ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 rounded-lg px-2.5 text-xs"
                        onClick={() => void handleRemoveAvatar()}
                        disabled={isSaving}
                        data-testid="portal-profile-remove-avatar-button"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        <span>{t("avatarRemove")}</span>
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 w-full space-y-1">
                  <h2 className="font-heading text-foreground truncate text-base font-bold">
                    {displayName || user.username}
                  </h2>
                  <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                </div>

                {/* Trạng thái tài khoản & xác minh email */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  <Badge
                    variant={user.isActive ? "default" : "destructive"}
                    className="text-[11px]"
                  >
                    {user.isActive ? tPortal("statusActive") : tPortal("statusInactive")}
                  </Badge>

                  {user.isVerified ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="size-3" aria-hidden />
                      <span>{t("emailVerified")}</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-700 dark:text-amber-400"
                    >
                      <AlertCircle className="size-3" aria-hidden />
                      <span>{t("emailUnverified")}</span>
                    </Badge>
                  )}
                </div>

                {!user.isVerified ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2.5 h-8 text-xs font-medium"
                    onClick={() => void handleSendVerificationEmail()}
                    disabled={isSendingVerification || verificationCooldown > 0}
                  >
                    {isSendingVerification ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
                    ) : null}
                    {verificationCooldown > 0
                      ? `${t("resendVerification")} (${verificationCooldown}s)`
                      : t("sendVerificationEmail")}
                  </Button>
                ) : null}
              </div>

              {/* Vai trò hệ thống */}
              {allRoles.length <= 1 ? (
                <div className="border-border/60 bg-muted/25 flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5">
                  <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                    <Shield className="text-primary size-3.5 shrink-0" aria-hidden />
                    <span>{t("roles")}</span>
                  </div>
                  {allRoles.length === 1 ? (
                    <Badge variant={allRoles[0].variant} className="text-[11px] font-semibold">
                      {allRoles[0].label}
                    </Badge>
                  ) : null}
                </div>
              ) : (
                <div className="border-border/60 bg-muted/25 space-y-2 rounded-xl border p-3">
                  <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                    <Shield className="text-primary size-3.5 shrink-0" aria-hidden />
                    <span>{t("roles")}</span>
                  </div>
                  <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pt-0.5 pr-1">
                    {allRoles.map((role) => (
                      <Badge key={role.key} variant={role.variant} className="text-[11px]">
                        {role.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông tin hoạt động & tài khoản */}
              <div className="border-border/60 bg-muted/25 space-y-2.5 rounded-xl border p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {tPortal("usernameLabel")}:
                  </span>
                  <span className="text-foreground truncate font-mono font-medium">
                    {user.username}
                  </span>
                </div>

                <div className="border-border/40 flex flex-col gap-1 border-t pt-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3 shrink-0" aria-hidden />
                    <span>{t("activity.lastLogin")}</span>
                  </span>
                  <span className="text-foreground pl-[18px] font-medium">
                    {user.lastLogin ? (
                      <TimestampText value={user.lastLogin} className="whitespace-nowrap" />
                    ) : (
                      t("activity.never")
                    )}
                  </span>
                </div>

                <div className="border-border/40 flex flex-col gap-1 border-t pt-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3 shrink-0" aria-hidden />
                    <span>{t("activity.dateJoined")}</span>
                  </span>
                  <span className="text-foreground pl-[18px] font-medium">
                    {user.dateJoined ? (
                      <TimestampText value={user.dateJoined} className="whitespace-nowrap" />
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CỘT PHẢI: Card tab cấu hình tách bạch CardHeader và CardContent */}
        <div className="min-w-0">
          <Card className="border-border bg-card gap-0 py-0 shadow-2xs">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as ProfileTab)}
              className="gap-0"
            >
              <CardHeader className="border-border/60 bg-muted/20 border-b px-5 py-4 sm:px-6">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                  <TabsTrigger value="info" className="min-w-0">
                    <User className="size-4" aria-hidden />
                    <span className="truncate">{t("tabs.info")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="min-w-0">
                    <KeyRound className="size-4" aria-hidden />
                    <span className="truncate">{t("tabs.security")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="social" className="min-w-0">
                    <Link2 className="size-4" aria-hidden />
                    <span className="truncate">{t("tabs.social")}</span>
                  </TabsTrigger>
                  {canNotifications ? (
                    <TabsTrigger value="notifications" className="min-w-0">
                      <BellIcon className="size-4" aria-hidden />
                      <span className="truncate">{t("tabs.notifications")}</span>
                    </TabsTrigger>
                  ) : null}
                </TabsList>
              </CardHeader>

              <CardContent className="p-5 sm:p-6">
                {/* TAB 1: THÔNG TIN CÁ NHÂN */}
                <TabsContent value="info" className="mt-0">
                  <CardDescription className="mb-5 text-sm">
                    {tPortal("infoDescription")}
                  </CardDescription>

                  <Form id={PROFILE_INFO_FORM_ID} onSubmit={onSaveInfo} className="space-y-4">
                    {infoErrors.root?.message ? (
                      <div
                        role="alert"
                        className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-sm"
                      >
                        <ShieldAlert className="size-4 shrink-0" aria-hidden />
                        <span>{infoErrors.root.message}</span>
                      </div>
                    ) : null}

                    <FormField control={infoForm.control} name="email" label={t("email")} required>
                      {(field) => (
                        <EmailInput
                          {...field}
                          placeholder={t("emailPlaceholder")}
                          disabled={isSaving}
                          autoComplete="email"
                          data-testid="portal-profile-email-input"
                        />
                      )}
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={infoForm.control}
                        name="username"
                        label={t("username")}
                        required
                      >
                        {(field) => (
                          <Input
                            {...field}
                            placeholder={t("usernamePlaceholder")}
                            disabled={isSaving}
                            autoComplete="username"
                            data-testid="portal-profile-username-input"
                          />
                        )}
                      </FormField>

                      <FormField
                        control={infoForm.control}
                        name="fullName"
                        label={t("fullName")}
                        required
                      >
                        {(field) => (
                          <Input
                            {...field}
                            placeholder={t("fullNamePlaceholder")}
                            disabled={isSaving}
                            autoComplete="name"
                            data-testid="portal-profile-fullname-input"
                          />
                        )}
                      </FormField>
                    </div>

                    <div className="border-border/60 flex justify-end border-t pt-4">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="gap-2"
                        data-testid="portal-profile-save-info-button"
                      >
                        {isSaving ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <Check className="size-4" aria-hidden />
                        )}
                        <span>{isSaving ? t("saving") : t("saveInfo")}</span>
                      </Button>
                    </div>
                  </Form>
                </TabsContent>

                {/* TAB 2: BẢO MẬT & ĐỔI MẬT KHẨU */}
                <TabsContent value="security" className="mt-0">
                  <Form
                    id={PROFILE_PASSWORD_FORM_ID}
                    onSubmit={onSavePassword}
                    className="space-y-4"
                  >
                    {passwordErrors.root?.message ? (
                      <div
                        role="alert"
                        className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-sm"
                      >
                        <ShieldAlert className="size-4 shrink-0" aria-hidden />
                        <span>{passwordErrors.root.message}</span>
                      </div>
                    ) : null}

                    <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border p-3.5">
                      <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
                      <div className="space-y-1 text-xs">
                        <p className="text-foreground font-semibold">{t("securityTitle")}</p>
                        <p className="text-muted-foreground leading-relaxed">
                          {t("securityDescription")}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={passwordForm.control}
                        name="password"
                        label={t("newPassword")}
                        required
                      >
                        {(field) => (
                          <PasswordInput
                            {...field}
                            placeholder={t("newPasswordPlaceholder")}
                            autoComplete="new-password"
                            disabled={isSaving}
                            data-testid="portal-profile-new-password-input"
                          />
                        )}
                      </FormField>

                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        label={t("confirmPassword")}
                        required
                      >
                        {(field) => (
                          <PasswordInput
                            {...field}
                            placeholder={t("confirmPasswordPlaceholder")}
                            autoComplete="new-password"
                            disabled={isSaving}
                            data-testid="portal-profile-confirm-password-input"
                          />
                        )}
                      </FormField>
                    </div>

                    <div className="border-border/60 flex justify-end border-t pt-4">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="gap-2"
                        data-testid="portal-profile-save-password-button"
                      >
                        {isSaving ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <Shield className="size-4" aria-hidden />
                        )}
                        <span>{isSaving ? t("saving") : t("savePassword")}</span>
                      </Button>
                    </div>
                  </Form>
                </TabsContent>

                {/* TAB 3: TÀI KHOẢN LIÊN KẾT */}
                <TabsContent value="social" className="mt-0 space-y-4">
                  <div className="border-border/60 bg-muted/20 rounded-xl border p-3.5">
                    <p className="text-foreground text-sm font-semibold">
                      {t("connectedAccounts")}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {t("connectedAccountsDesc")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {SOCIAL_PROVIDERS.map((provider) => {
                      const account = socialAccounts.find((item) => item.provider === provider.id);
                      const isConnected = account?.isConnected ?? false;
                      const isConfigured = account?.isConfigured ?? false;
                      const isEnabled = (account as { isEnabled?: boolean })?.isEnabled ?? true;
                      const isConnecting = connectingProvider === provider.id;

                      return (
                        <div
                          key={provider.id}
                          className="border-border/60 bg-background flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="bg-muted/40 border-border/50 flex size-10 shrink-0 items-center justify-center rounded-lg border">
                              <Image
                                src={ICON_PATHS[provider.id]}
                                alt={provider.label}
                                width={20}
                                height={20}
                                className={provider.id === "github" ? "dark:invert" : undefined}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground text-sm font-semibold">
                                  {provider.label}
                                </span>
                                {isConnected ? (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"
                                  >
                                    {t("connected")}
                                  </Badge>
                                ) : !isEnabled ? (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500/30 bg-amber-500/10 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                                  >
                                    {t("temporarilyDisabled")}
                                  </Badge>
                                ) : isConfigured ? (
                                  <Badge
                                    variant="outline"
                                    className="text-muted-foreground text-[10px]"
                                  >
                                    {t("notConnected")}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-muted-foreground text-[10px]"
                                  >
                                    {t("notConfigured")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground truncate text-xs">
                                {isConnected
                                  ? account?.email || account?.displayName || t("connected")
                                  : !isEnabled
                                    ? t("disabledByAdminDesc")
                                    : isConfigured
                                      ? provider.description
                                      : t("notConfigured")}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isConnected ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 text-xs"
                                onClick={() => handleRequestUnlink(provider.id)}
                                disabled={isUnlinking}
                              >
                                {t("disconnect")}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs font-medium"
                                onClick={() => void handleLink(provider.id)}
                                disabled={!isConfigured || isConnecting || !isEnabled}
                              >
                                {isConnecting ? (
                                  <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
                                ) : null}
                                {isConnecting ? t("connecting") : t("connect")}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* TAB 4: THÔNG BÁO */}
                {canNotifications ? (
                  <TabsContent value="notifications" className="mt-0 space-y-5">
                    <NotificationSettingsTab />
                    {canPreferences && canPreferenceUpdate ? (
                      <div className="border-border/60 flex justify-end border-t pt-4">
                        <Button
                          form={NOTIFICATION_PREFERENCES_FORM_ID}
                          type="submit"
                          data-testid="portal-profile-save-notifications-button"
                        >
                          {tPreferences("save")}
                        </Button>
                      </div>
                    ) : null}
                  </TabsContent>
                ) : null}
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(unlinkProvider)}
        onOpenChange={(next) => !next && handleCancelUnlink()}
        title={t("disconnectConfirmTitle", {
          provider: unlinkProvider ? (unlinkProvider === "google" ? "Google" : "GitHub") : "",
        })}
        description={t("disconnectConfirmDescription", {
          provider: unlinkProvider ? (unlinkProvider === "google" ? "Google" : "GitHub") : "",
          account:
            socialAccounts.find((item) => item.provider === unlinkProvider)?.email ||
            socialAccounts.find((item) => item.provider === unlinkProvider)?.displayName ||
            "",
        })}
        confirmLabel={t("disconnectConfirmAction")}
        onConfirm={() => void handleConfirmUnlink()}
        isPending={isUnlinking}
        destructive
      />

      {libraryOpen && canReadAttachments ? (
        <AttachmentPicker
          canUpload={canUploadAttachments}
          onSelect={(file) => {
            void handleSelectAvatar(file);
            setLibraryOpen(false);
          }}
          onClose={() => setLibraryOpen(false)}
        />
      ) : null}
    </div>
  );
}
