"use client";

import { Calendar, Clock, Images, KeyRound, Loader2, Shield, ShieldAlert, ShieldCheck, Trash2, User } from "lucide-react";
import { useFormatter, useNow } from "next-intl";

import { EmailInput } from "@/shares/components/common/email-input";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { PasswordInput } from "@/shares/components/common/password-input";
import { UserAvatar } from "@/shares/components/common/user-avatar";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shares/components/ui/dialog";
import { Input } from "@/shares/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import type { AuthRole, AuthUser } from "../types/auth.types";
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
  } = useProfileDialog({
    user,
    roles,
    open,
  });

  const infoErrors = infoForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl"
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

        {/* Bố cục 2 cột cân bằng, hiển thị trọn vẹn trong màn hình không cần scroll */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
          {/* CỘT TRÁI: Thẻ định danh người dùng, vai trò và thông tin hoạt động */}
          <div className="border-border/60 bg-muted/25 flex flex-col justify-between space-y-6 border-b p-5 sm:p-6 md:border-r md:border-b-0">
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
                  {renderAttachmentPicker ? (
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
                </div>
              </div>

              {/* Thông tin vai trò (Roles) */}
              <div className="border-border/60 bg-background/60 space-y-2 rounded-xl border p-3">
                <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                  <Shield className="text-primary size-3.5" aria-hidden />
                  <span>{t("roles")}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {user?.isSuperuser ? (
                    <Badge variant="default" className="text-[11px] font-semibold">
                      {t("roleSuperuser")}
                    </Badge>
                  ) : null}
                  {user?.isStaff && !user.isSuperuser ? (
                    <Badge variant="secondary" className="text-[11px] font-semibold">
                      {t("roleStaff")}
                    </Badge>
                  ) : null}
                  {user?.isNovel ? (
                    <Badge variant="outline" className="text-[11px]">
                      {t("roleNovel")}
                    </Badge>
                  ) : null}
                  {roles.map((role) => (
                    <Badge key={role.id} variant="outline" className="text-[11px]">
                      {role.name}
                    </Badge>
                  ))}
                  {!user?.isSuperuser && !user?.isStaff && roles.length === 0 ? (
                    <Badge variant="ghost" className="text-muted-foreground text-[11px]">
                      {t("roleUser")}
                    </Badge>
                  ) : null}
                </div>
              </div>
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
          <div className="flex flex-col justify-between p-5 sm:p-6">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "info" | "security")}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="info">
                  <User className="size-4" aria-hidden />
                  <span>{t("tabs.info")}</span>
                </TabsTrigger>
                <TabsTrigger value="security">
                  <KeyRound className="size-4" aria-hidden />
                  <span>{t("tabs.security")}</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              <TabsContent value="info">
                <Form onSubmit={onSaveInfo} className="space-y-4">
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField control={infoForm.control} name="lastName" label={t("lastName")}>
                      {(field) => (
                        <Input
                          {...field}
                          placeholder={t("lastNamePlaceholder")}
                          disabled={isSaving}
                          autoComplete="family-name"
                          data-testid="profile-lastname-input"
                        />
                      )}
                    </FormField>

                    <FormField control={infoForm.control} name="firstName" label={t("firstName")}>
                      {(field) => (
                        <Input
                          {...field}
                          placeholder={t("firstNamePlaceholder")}
                          disabled={isSaving}
                          autoComplete="given-name"
                          data-testid="profile-firstname-input"
                        />
                      )}
                    </FormField>
                  </div>

                  <div className="border-border/50 flex justify-end gap-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSaving}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
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
                  </div>
                </Form>
              </TabsContent>

              {/* TAB 2: ĐỔI MẬT KHẨU (THIẾT KẾ RIÊNG BIỆT) */}
              <TabsContent value="security">
                <Form onSubmit={onSavePassword} className="space-y-4">
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

                  <div className="border-border/50 flex justify-end gap-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSaving}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
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
                  </div>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>

      {libraryOpen && renderAttachmentPicker
        ? renderAttachmentPicker({
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
