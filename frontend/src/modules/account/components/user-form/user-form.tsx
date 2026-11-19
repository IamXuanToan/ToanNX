"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Controller, useWatch } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { AttachmentImageUploadView } from "@/modules/attachment/views/attachment-image-upload-view";
import { getUserInitials } from "@/shares/components/common/user-avatar/user-avatar";
import { ChoiceList } from "@/shares/components/common/choice-list/choice-list";
import { EmailInput } from "@/shares/components/common/email-input/email-input";
import { Form } from "@/shares/components/common/form/form";
import { FormExtensionContext } from "@/shares/components/common/form/hooks/use-form-extension";
import { FormField } from "@/shares/components/common/form-field/form-field";
import { FormActions } from "@/shares/components/common/form-layout/components/form-actions";
import { FormSubmitButton } from "@/shares/components/common/form-layout/components/form-submit-button";
import { FormSection } from "@/shares/components/common/form-layout/components/form-section";
import { FormLayout } from "@/shares/components/common/form-layout/form-layout";
import { PasswordInput } from "@/shares/components/common/password-input/password-input";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { ACCOUNT_ROUTES } from "../../constants/routes";
import type { User } from "../../types/user.types";
import { UserActivitySection } from "./user-activity-section";
import { useUserForm } from "./hooks/use-user-form";

const FLAGS = ["isActive", "isStaff", "isSuperuser", "isNovel"] as const;

/**
 * Form người dùng **dùng chung cho tạo, sửa và chi tiết** (cùng bố cục, cùng trường):
 * - Cột chính, một card "Thông tin tài khoản": ảnh đại diện, email, tên người dùng, họ, tên, mật khẩu.
 * - Cột phụ: card "Truy cập" (các cờ dạng danh sách công tắc), khi sửa thêm card "Hoạt động".
 * - Dưới hai cột, trải ngang: phần mở rộng của module khác (`extensions`, IAM: vai trò).
 * - Thanh nút dính đáy: Hủy + Tạo/Lưu.
 *
 * @param props - Người dùng (khi sửa), id nguồn khi sao chép, quyền sửa và slot mở rộng.
 * @returns Form người dùng.
 */
export function UserForm({
  user,
  copyFrom,
  canEdit = true,
  extensions,
}: {
  user?: User;
  copyFrom?: string;
  canEdit?: boolean;
  extensions?: ReactNode;
}) {
  const t = useTranslations("account.users");
  const tCommon = useTranslations("common.actions");
  const state = useUserForm({ user, copyFrom });
  const { form, isSubmitting } = state;
  const { errors } = form.formState;
  const disabled = !canEdit || isSubmitting;
  const flags = useWatch({ control: form.control, name: FLAGS });
  const [firstName, lastName, email, username] = useWatch({
    control: form.control,
    name: ["firstName", "lastName", "email", "username"],
  });
  const initials = getUserInitials({ firstName, lastName, email, username });

  if (state.isLoadingSource) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (state.source.isError) {
    return (
      <ErrorState
        message={state.errorMessage(state.source.error)}
        onRetry={() => state.source.refetch()}
      />
    );
  }

  return (
    <Form onSubmit={state.onSubmit}>
      {errors.root ? (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {errors.root.message}
        </p>
      ) : null}
      <FormLayout
        aside={
          <>
            <FormSection title={t("sections.access")}>
              <ChoiceList
                control="switch"
                items={FLAGS.filter((flag) => flag !== "isSuperuser" || state.canSetSuperuser).map(
                  (flag) => ({
                    value: flag,
                    label: t(`fields.${flag}`),
                    description: t(`fields.${flag}Hint`),
                  }),
                )}
                value={FLAGS.filter((_, index) => flags[index])}
                onToggle={(flag, checked) =>
                  form.setValue(flag as (typeof FLAGS)[number], checked, { shouldDirty: true })
                }
                disabled={disabled}
                aria-label={t("sections.access")}
              />
            </FormSection>
            {user ? <UserActivitySection user={user} /> : null}
          </>
        }
      >
        <FormSection title={t("profile")}>
          <Controller
            control={form.control}
            name="avatar"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <AttachmentImageUploadView
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  aria-label={t("fields.avatar")}
                  fallback={
                    initials ? (
                      <span className="text-lg font-semibold" aria-hidden>
                        {initials}
                      </span>
                    ) : undefined
                  }
                />
                {fieldState.error ? (
                  <p role="alert" className="text-destructive text-sm">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField control={form.control} name="email" label={t("fields.email")} required>
              {(field) => <EmailInput {...field} autoFocus={!user} disabled={disabled} />}
            </FormField>
            <FormField control={form.control} name="username" label={t("fields.username")} required>
              {(field) => (
                <Input {...field} autoComplete="off" maxLength={150} disabled={disabled} />
              )}
            </FormField>
            <FormField control={form.control} name="lastName" label={t("fields.lastName")}>
              {(field) => <Input {...field} autoComplete="family-name" disabled={disabled} />}
            </FormField>
            <FormField control={form.control} name="firstName" label={t("fields.firstName")}>
              {(field) => <Input {...field} autoComplete="given-name" disabled={disabled} />}
            </FormField>
          </div>
          <FormField
            control={form.control}
            name="password"
            label={user ? t("fields.newPassword") : t("fields.password")}
            required={!user}
            description={user ? t("fields.newPasswordHint") : t("fields.passwordHint")}
          >
            {(field) => (
              <PasswordInput {...field} autoComplete="new-password" disabled={disabled} />
            )}
          </FormField>
        </FormSection>
      </FormLayout>
      {/* Quan hệ (vai trò…) do module khác cắm vào: khối trải hết bề ngang dưới hai cột, vì danh sách có thể dài. */}
      {extensions ? (
        <div className="mt-6">
          <FormExtensionContext.Provider value={{ ...state.extensions, disabled }}>
            {extensions}
          </FormExtensionContext.Provider>
        </div>
      ) : null}
      <FormActions start={canEdit && user && state.isDirty ? tCommon("unsaved") : null}>
        {/* Hủy là lối quay lại danh sách; chỉ xem thì nút này ghi "Quay lại". */}
        <Button asChild variant="outline">
          <Link href={ACCOUNT_ROUTES.users}>{canEdit ? tCommon("cancel") : tCommon("back")}</Link>
        </Button>
        {canEdit ? (
          <FormSubmitButton isSubmitting={isSubmitting} disabled={Boolean(user) && !state.isDirty}>
            {user ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        ) : null}
      </FormActions>
    </Form>
  );
}
