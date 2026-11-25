"use client";

import {
  AlertCircle,
  Bell as BellIcon,
  Calendar,
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
import { useFormatter, useNow, useTranslations } from "next-intl";

import Image from "next/image";
import { ConfirmDialog } from "@/shares/components/common/confirm-dialog";
import { EmailInput } from "@/shares/components/common/email-input";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { PasswordInput } from "@/shares/components/common/password-input";
import { UserAvatar } from "@/shares/components/common/user-avatar";
import { ICON_PATHS } from "@/shares/lib/asset-paths";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import {
  NOTIFICATION_PREFERENCES_FORM_ID,
  PROFILE_INFO_FORM_ID,
  PROFILE_PASSWORD_FORM_ID,
} from "../../constants/profile-forms";
import { usePermission } from "../../hooks/use-permission";
import { ATTACHMENT_PERMISSIONS } from "../../permissions/attachment-permission";
import { NOTIFICATION_PREFERENCE_PERMISSIONS } from "../../permissions/notification-preference-permission";
import { TELEGRAM_BOT_PERMISSIONS } from "../../permissions/telegram-bot-permission";
import type { AuthRole, AuthUser } from "../../types/auth.types";
import type { ProfileTab } from "../../types/profile-tab.types";
import { AttachmentPicker } from "../attachment/attachment-picker";
import { NotificationSettingsTab } from "../notification-preference/notification-settings-tab";
import { useProfileDialog } from "./hooks/use-profile-dialog";

type ProfileDialogProps = {
  /** Người dùng đang đăng nhập. */
  user: AuthUser | undefined;
  /** Danh sách vai trò của người dùng. */
  roles?: AuthRole[];
  /** Trạng thái mở modal dialog. */
  open: boolean;
  /** Callback thay đổi trạng thái mở modal dialog. */
  onOpenChange: (open: boolean) => void;
  /** Render prop mở thư viện ảnh Attachment (nếu caller hỗ trợ). */
  renderAttachmentPicker?: (props: {
    onSelect: (file: { id: string; url: string }) => void;
    onClose: () => void;
  }) => React.ReactNode;
};

/**
 * Dialog hồ sơ cá nhân chuẩn hóa:
 * - Không thanh cuộn bên trong, trải rộng theo thiết kế 2 cột cân đối.
 * - Cột trái: Thẻ định danh người dùng (avatar lớn có nút đổi/gỡ ảnh, tên, email, vai trò hệ thống, trạng thái online & lần login cuối).
 * - Cột phải: Các tab thao tác riêng biệt (Thông tin cá nhân & Đổi mật khẩu) giúp tách biệt rõ ràng việc đổi mật khẩu.
 *
 * @param props - Thông tin người dùng, vai trò và trạng thái mở dialog.
 * @returns Dialog hồ sơ cá nhân.
 */
export function ProfileDialog({
  user,
  roles = [],
  open,
  onOpenChange,
  renderAttachmentPicker,
}: ProfileDialogProps) {
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });

  const canPreferences = usePermission(NOTIFICATION_PREFERENCE_PERMISSIONS.read);
  const canReadAttachments = usePermission(ATTACHMENT_PERMISSIONS.read);
  const canUploadAttachments = usePermission(ATTACHMENT_PERMISSIONS.create);
  const hasTelegramBotPermission = usePermission(TELEGRAM_BOT_PERMISSIONS.read);
  const canTelegramBot = Boolean(user?.isSuperuser) && hasTelegramBotPermission;
  const canNotifications = canPreferences || canTelegramBot;
  const canPreferenceUpdate = usePermission(NOTIFICATION_PREFERENCE_PERMISSIONS.update);
  const tPreferences = useTranslations("system.notifications.preferences");
  const {
    t,
    displayName,
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
  } = useProfileDialog({
    user,
    roles,
    open,
  });

  const fallbackRenderAttachmentPicker = canReadAttachments
    ? (pickerProps: {
        onSelect: (file: { id: string; url: string }) => void;
        onClose: () => void;
      }) => <AttachmentPicker canUpload={canUploadAttachments} {...pickerProps} />
    : undefined;

  const effectiveRenderAttachmentPicker = renderAttachmentPicker ?? fallbackRenderAttachmentPicker;

  const infoErrors = infoForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  const allRoles: {
    key: string;
    label: string;
    variant: "default" | "secondary" | "outline" | "ghost";
  }[] = [];
  if (user?.isSuperuser) {
    allRoles.push({ key: "superuser", label: t("roleSuperuser"), variant: "default" });
  }
  if (user?.isStaff && !user.isSuperuser) {
    allRoles.push({ key: "staff", label: t("roleStaff"), variant: "secondary" });
  }
  if (user?.isNovel) {
    allRoles.push({ key: "novel", label: t("roleNovel"), variant: "outline" });
  }
  for (const role of roles) {
    allRoles.push({ key: role.id, label: role.name, variant: "outline" });
  }
  if (!user?.isSuperuser && !user?.isStaff && roles.length === 0) {
    allRoles.push({ key: "user", label: t("roleUser"), variant: "ghost" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(85vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl"
        data-testid="profile-dialog"
      >
        <DialogHeader className="border-border/60 border-b px-6 py-4">
          <div className="text-primary flex items-center gap-2.5">
            <User className="size-5 shrink-0" aria-hidden />
            <DialogTitle className="text-lg font-bold">{t("title")}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {/* Hai cột từ md (trái: thẻ người dùng rộng cố định, phải: tabs), dưới md xếp chồng. Thân cuộn riêng
            (header/footer đứng yên); cột phải `flex-1 min-w-0` để bảng rộng trong tab Thông báo cuộn ngang trong
            khung của nó thay vì đẩy cả dialog tràn ra ngoài. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row">
          {/* CỘT TRÁI: Thẻ định danh người dùng, vai trò và thông tin hoạt động */}
          <div className="border-border/60 bg-muted/25 flex flex-col justify-between space-y-6 border-b p-5 sm:p-6 md:w-72 md:shrink-0 md:border-r md:border-b-0 lg:w-80">
            <div className="space-y-4">
              {/* Vùng Avatar và các nút thao tác ảnh */}
              <div className="flex flex-col items-center text-center">
                <div className="group relative">
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

                <div className="mt-3 flex items-center gap-2">
                  {effectiveRenderAttachmentPicker ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="h-8 gap-1.5 rounded-lg text-xs font-medium"
                      onClick={() => setLibraryOpen(true)}
                      disabled={isSaving}
                      data-testid="profile-open-library-button"
                    >
                      <Images className="size-3.5" aria-hidden />
                      <span>{t("avatarLibrary")}</span>
                    </Button>
                  ) : null}

                  {user?.avatar ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 rounded-lg px-2 text-xs"
                      onClick={() => void handleRemoveAvatar()}
                      disabled={isSaving}
                      title={t("avatarRemove")}
                      data-testid="profile-remove-avatar-button"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      <span>{t("avatarRemove")}</span>
                    </Button>
                  ) : null}
                </div>

                <p className="text-muted-foreground mt-1 text-[11px]">{t("avatarHint")}</p>

                <div className="mt-3 w-full">
                  <h3 className="font-heading text-foreground truncate text-base font-bold">
                    {displayName || user?.username}
                  </h3>
                  <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
                  <div className="mt-2 flex flex-col items-center gap-1.5">
                    {user?.isVerified ? (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="size-3" aria-hidden />
                        <span>{t("emailVerified")}</span>
                      </Badge>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-700 dark:text-amber-400"
                        >
                          <AlertCircle className="size-3" aria-hidden />
                          <span>{t("emailUnverified")}</span>
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 text-[11px] font-medium"
                          onClick={() => void handleSendVerificationEmail()}
                          disabled={isSendingVerification || verificationCooldown > 0}
                        >
                          {isSendingVerification ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : null}
                          {verificationCooldown > 0
                            ? `${t("resendVerification")} (${verificationCooldown}s)`
                            : t("sendVerificationEmail")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thông tin vai trò (Roles) */}
              {allRoles.length <= 1 ? (
                <div className="border-border/60 bg-background/60 flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5">
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
                <div className="border-border/60 bg-background/60 space-y-2 rounded-xl border p-3">
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
            </div>

            {/* Thông tin hoạt động đăng nhập & thời gian */}
            <div className="border-border/60 bg-background/60 space-y-2.5 rounded-xl border p-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex shrink-0 items-center gap-1">
                  <Clock className="size-3" aria-hidden />
                  <span>{t("activity.lastLogin")}</span>
                </span>
                <span className="text-foreground truncate text-right font-medium">
                  {user?.lastLogin ? (
                    <span
                      title={format.dateTime(new Date(user.lastLogin), {
                        dateStyle: "full",
                        timeStyle: "medium",
                      })}
                    >
                      {format.relativeTime(new Date(user.lastLogin), now)}
                    </span>
                  ) : (
                    t("activity.never")
                  )}
                </span>
              </div>

              <div className="border-border/40 flex items-start justify-between gap-2 border-t pt-2">
                <span className="text-muted-foreground flex shrink-0 items-center gap-1">
                  <Calendar className="size-3" aria-hidden />
                  <span>{t("activity.dateJoined")}</span>
                </span>
                <span className="text-foreground truncate text-right font-medium">
                  {user?.dateJoined
                    ? format.dateTime(new Date(user.dateJoined), { dateStyle: "medium" })
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Tabs thao tác (Thông tin cá nhân & Đổi mật khẩu) */}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as ProfileTab)}
              className="w-full"
            >
              <TabsList
                className={canNotifications ? "grid w-full grid-cols-4" : "grid w-full grid-cols-3"}
              >
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

              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              <TabsContent value="info">
                <Form id={PROFILE_INFO_FORM_ID} onSubmit={onSaveInfo} className="space-y-4">
                  {infoErrors.root?.message ? (
                    <div
                      role="alert"
                      className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs"
                    >
                      <ShieldAlert className="size-4 shrink-0" aria-hidden />
                      <span>{infoErrors.root.message}</span>
                    </div>
                  ) : null}

                  {/* Ô đổi email */}
                  <FormField control={infoForm.control} name="email" label={t("email")} required>
                    {(field) => (
                      <EmailInput
                        {...field}
                        placeholder={t("emailPlaceholder")}
                        disabled={isSaving}
                        autoComplete="email"
                        data-testid="profile-email-input"
                      />
                    )}
                  </FormField>

                  {/* Tên người dùng */}
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
                        data-testid="profile-username-input"
                      />
                    )}
                  </FormField>

                  {/* Họ và tên */}
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
                        data-testid="profile-fullname-input"
                      />
                    )}
                  </FormField>
                </Form>
              </TabsContent>

              {/* TAB 2: ĐỔI MẬT KHẨU (THIẾT KẾ RIÊNG BIỆT) */}
              <TabsContent value="security">
                <Form id={PROFILE_PASSWORD_FORM_ID} onSubmit={onSavePassword} className="space-y-4">
                  {passwordErrors.root?.message ? (
                    <div
                      role="alert"
                      className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs"
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
                        data-testid="profile-new-password-input"
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
                        data-testid="profile-confirm-password-input"
                      />
                    )}
                  </FormField>
                </Form>
              </TabsContent>

              {/* TAB 3: TÀI KHOẢN LIÊN KẾT */}
              <TabsContent value="social">
                <div className="space-y-4">
                  <div className="border-border/60 bg-muted/20 rounded-xl border p-3.5">
                    <p className="text-foreground text-xs font-semibold">
                      {t("connectedAccounts")}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {t("connectedAccountsDesc")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Google */}
                    {(() => {
                      const account = socialAccounts.find((item) => item.provider === "google");
                      const isConnected = account?.isConnected ?? false;
                      const isConfigured = account?.isConfigured ?? false;
                      const isEnabled = (account as { isEnabled?: boolean })?.isEnabled ?? true;
                      const isConnecting = connectingProvider === "google";

                      return (
                        <div className="border-border/60 bg-background flex items-center justify-between gap-3 rounded-xl border p-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="bg-muted/40 border-border/50 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                              <Image src={ICON_PATHS.google} alt="Google" width={20} height={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground text-sm font-semibold">
                                  Google
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
                                      ? "Accounts Google (OAuth 2.0)"
                                      : t("notConfigured")}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isConnected ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 h-8 text-xs"
                                onClick={() => handleRequestUnlink("google")}
                                disabled={isUnlinking}
                              >
                                {t("disconnect")}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="h-8 text-xs font-medium"
                                onClick={() => void handleLink("google")}
                                disabled={!isConfigured || isConnecting || !isEnabled}
                              >
                                {isConnecting ? (
                                  <Loader2 className="mr-1 size-3 animate-spin" />
                                ) : null}
                                {isConnecting ? t("connecting") : t("connect")}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* GitHub */}
                    {(() => {
                      const account = socialAccounts.find((item) => item.provider === "github");
                      const isConnected = account?.isConnected ?? false;
                      const isConfigured = account?.isConfigured ?? false;
                      const isEnabled = (account as { isEnabled?: boolean })?.isEnabled ?? true;
                      const isConnecting = connectingProvider === "github";

                      return (
                        <div className="border-border/60 bg-background flex items-center justify-between gap-3 rounded-xl border p-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="bg-muted/40 border-border/50 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                              <Image
                                src={ICON_PATHS.github}
                                alt="GitHub"
                                width={20}
                                height={20}
                                className="dark:invert"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground text-sm font-semibold">
                                  GitHub
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
                                      ? "GitHub OAuth App"
                                      : t("notConfigured")}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isConnected ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 h-8 text-xs"
                                onClick={() => handleRequestUnlink("github")}
                                disabled={isUnlinking}
                              >
                                {t("disconnect")}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                className="h-8 text-xs font-medium"
                                onClick={() => void handleLink("github")}
                                disabled={!isConfigured || isConnecting || !isEnabled}
                              >
                                {isConnecting ? (
                                  <Loader2 className="mr-1 size-3 animate-spin" />
                                ) : null}
                                {isConnecting ? t("connecting") : t("connect")}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: THÔNG BÁO (chỉ khi có quyền tùy chọn thông báo hoặc bot Telegram) */}
              {canNotifications ? (
                <TabsContent value="notifications">
                  <NotificationSettingsTab />
                </TabsContent>
              ) : null}
            </Tabs>
          </div>
        </div>

        {/* Footer cố định ở đáy Dialog */}
        {/* Chiều cao dialog cố định: đổi tab chỉ thân cuộn, không nhảy kích thước. `mx-0 mb-0` bỏ lề âm mặc định
            của DialogFooter (dành cho DialogContent có p-4; ở đây p-0 nên lề âm đẩy footer lệch ra ngoài). */}
        <DialogFooter className="border-border/60 bg-background/95 mx-0 mb-0 flex shrink-0 items-center justify-end gap-2.5 border-t px-6 py-3.5 backdrop-blur-xs">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {activeTab === "social" ? t("close") : t("cancel")}
          </Button>
          {activeTab === "info" ? (
            <Button
              form={PROFILE_INFO_FORM_ID}
              type="submit"
              disabled={isSaving}
              data-testid="profile-save-info-button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("saveInfo")}</span>
              )}
            </Button>
          ) : null}
          {activeTab === "security" ? (
            <Button
              form={PROFILE_PASSWORD_FORM_ID}
              type="submit"
              disabled={isSaving}
              data-testid="profile-save-password-button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("savePassword")}</span>
              )}
            </Button>
          ) : null}
          {activeTab === "notifications" && canPreferences && canPreferenceUpdate ? (
            <Button
              form={NOTIFICATION_PREFERENCES_FORM_ID}
              type="submit"
              data-testid="profile-save-notifications-button"
            >
              {tPreferences("save")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>

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

      {libraryOpen && effectiveRenderAttachmentPicker
        ? effectiveRenderAttachmentPicker({
            onSelect: (file) => {
              void handleSelectAvatar(file);
              setLibraryOpen(false);
            },
            onClose: () => setLibraryOpen(false),
          })
        : null}
    </Dialog>
  );
}
