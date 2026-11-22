"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { ChoiceGroups } from "@/shares/components/common/choice-groups";
import { ChoiceList } from "@/shares/components/common/choice-list";
import { CodeInput } from "@/shares/components/common/code-input";
import { Form } from "@/shares/components/common/form";
import { FormField } from "@/shares/components/common/form-field";
import { FormActions } from "@/shares/components/common/form-actions";
import { FormSubmitButton } from "@/shares/components/common/form-submit-button";
import { FormSection } from "@/shares/components/common/form-section";
import { FormLayout } from "@/shares/components/common/form-layout";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { Input } from "@/shares/components/ui/input";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Textarea } from "@/shares/components/ui/textarea";

import { SYSTEM_ROUTES } from "../../constants/routes";
import type { RoleFormValues } from "../../schemas/role.schema";
import type { RoleDetail } from "../../types/iam.types";
import { useRoleForm } from "./hooks/use-role-form";

/**
 * Form vai trò **dùng chung cho tạo và sửa** (cùng bố cục, cùng trường): cột chính Thông tin (mã, tên,
 * mô tả), cột phụ Trạng thái, rồi khối Quyền (`ChoiceGroups` theo module, tick để chọn), thanh nút dính
 * đáy. Quyền lưu cùng nút Tạo/Lưu. Mã chỉ nhập khi tạo.
 *
 * @param props - Vai trò (khi sửa), khoá sửa, quyền xem/gán quyền, điền sẵn (sao chép), callback sau lưu.
 * @returns Form vai trò.
 */
export function RoleForm({
  role,
  disabled = false,
  canReadPermissions,
  canAssignPermissions,
  defaults,
  defaultPermissionIds,
  onSaved,
}: {
  role?: RoleDetail;
  disabled?: boolean;
  canReadPermissions: boolean;
  canAssignPermissions: boolean;
  defaults?: Partial<RoleFormValues>;
  defaultPermissionIds?: string[];
  onSaved?: (role: RoleDetail) => unknown;
}) {
  const t = useTranslations("system.iam.roles");
  const tCommon = useTranslations("common.actions");
  const tStatus = useTranslations("common.status");
  const state = useRoleForm({
    role,
    defaults,
    defaultPermissionIds,
    canReadPermissions,
    canAssignPermissions: canAssignPermissions && !disabled,
    onSaved,
  });
  const { form, isSubmitting, permissions } = state;
  const { errors } = form.formState;
  const locked = disabled || isSubmitting;
  const permissionsLocked = locked || !canAssignPermissions;
  const showPermissions = Boolean(role) || (canReadPermissions && canAssignPermissions);

  return (
    <Form onSubmit={state.onSubmit} className="space-y-6">
      {errors.root ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      ) : null}
      <FormLayout
        aside={
          <FormSection title={t("sections.status")}>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <ChoiceList
                  control="switch"
                  items={[
                    {
                      value: "isActive",
                      label: tStatus("active"),
                      description: t("fields.isActiveHint"),
                    },
                  ]}
                  value={field.value ? ["isActive"] : []}
                  onToggle={(_, checked) => field.onChange(checked)}
                  disabled={locked}
                  aria-label={t("sections.status")}
                />
              )}
            />
          </FormSection>
        }
      >
        <FormSection title={t("info")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              label={t("fields.code")}
              description={t("fields.codeHint")}
              required={!role}
            >
              {(field) => (
                <CodeInput
                  {...field}
                  uppercase
                  maxLength={64}
                  placeholder="NOVEL_EDITOR"
                  autoFocus={!role}
                  disabled={Boolean(role) || locked}
                />
              )}
            </FormField>
            <FormField control={form.control} name="name" label={t("fields.name")} required>
              {(field) => <Input {...field} maxLength={150} disabled={locked} />}
            </FormField>
          </div>
          <FormField control={form.control} name="description" label={t("fields.description")}>
            {(field) => <Textarea {...field} rows={3} disabled={locked} />}
          </FormField>
        </FormSection>
      </FormLayout>

      {showPermissions ? (
        <section className="space-y-3" aria-labelledby="role-permissions-title">
          <div className="space-y-1">
            <h2 id="role-permissions-title" className="text-lg font-semibold">
              {t("permissions")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {role?.isSystem
                ? t("systemHint")
                : t("permissionsSelected", { count: permissions.selected.length })}
            </p>
          </div>
          {permissions.isLoading ? <Skeleton className="h-40 rounded-xl" /> : null}
          {permissions.isError ? <ErrorState onRetry={() => permissions.query.refetch()} /> : null}
          {!permissions.isLoading && !permissions.isError ? (
            <ChoiceGroups
              groups={permissions.groups}
              value={permissions.selected}
              onChange={permissionsLocked ? undefined : permissions.setSelected}
              control={canAssignPermissions ? "checkbox" : "none"}
              disabled={permissionsLocked}
              actions={
                !permissionsLocked && permissions.selected.length ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => permissions.setSelected([])}
                  >
                    {t("clearPermissions")}
                  </Button>
                ) : null
              }
            />
          ) : null}
        </section>
      ) : null}

      <FormActions start={!disabled && role && state.isDirty ? tCommon("unsaved") : null}>
        {/* Hủy là lối quay lại danh sách; chỉ xem thì nút này ghi "Quay lại". */}
        <Button asChild variant="outline">
          <Link href={SYSTEM_ROUTES.roles}>{disabled ? tCommon("back") : tCommon("cancel")}</Link>
        </Button>
        {!disabled ? (
          <FormSubmitButton isSubmitting={isSubmitting} disabled={Boolean(role) && !state.isDirty}>
            {role ? tCommon("save") : tCommon("create")}
          </FormSubmitButton>
        ) : null}
      </FormActions>
    </Form>
  );
}
