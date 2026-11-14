"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { SwitchField } from "@/shares/components/common/switch-field";
import { Button } from "@/shares/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import type { RoleDetail } from "../../types/iam.types";
import { useRoleForm } from "./hooks/use-role-form";

/**
 * Form tạo/cập nhật vai trò. Mã vai trò chỉ nhập khi tạo mới.
 *
 * @param props - Vai trò (khi sửa), quyền sửa, callback hoàn tất.
 * @returns Form vai trò.
 */
export function RoleForm({
  role,
  disabled = false,
  onDone,
}: {
  role?: RoleDetail;
  disabled?: boolean;
  onDone?: (role: RoleDetail) => void;
}) {
  const t = useTranslations("iam.roles");
  const tCommon = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting } = useRoleForm(role, onDone);
  const { errors } = form.formState;
  const locked = disabled || isSubmitting;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors.root ? <p className="text-destructive text-sm">{errors.root.message}</p> : null}
      <FieldGroup>
        <Field data-invalid={Boolean(errors.code)}>
          <FieldLabel htmlFor="role-code">{t("fields.code")}</FieldLabel>
          <Input
            id="role-code"
            className="font-mono uppercase"
            disabled={Boolean(role) || locked}
            {...form.register("code", { setValueAs: (value: string) => value.toUpperCase() })}
          />
          <FieldDescription>{t("fields.codeHint")}</FieldDescription>
          <FieldError errors={[errors.code]} />
        </Field>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="role-name">{t("fields.name")}</FieldLabel>
          <Input id="role-name" disabled={locked} {...form.register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="role-description">{t("fields.description")}</FieldLabel>
          <Input id="role-description" disabled={locked} {...form.register("description")} />
        </Field>
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <SwitchField
              label={t("fields.isActive")}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={locked}
            />
          )}
        />
      </FieldGroup>
      {!disabled ? (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || (Boolean(role) && !form.formState.isDirty)}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            {role ? tCommon("save") : tCommon("create")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
