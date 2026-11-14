"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { PasswordInput } from "@/shares/components/common/password-input";
import { SwitchField } from "@/shares/components/common/switch-field";
import { Button } from "@/shares/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shares/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import type { User } from "../../types/account.types";
import { useUserEditForm } from "./hooks/use-user-edit-form";

const FLAGS = ["isActive", "isStaff", "isNovel"] as const;

/**
 * Form cập nhật thông tin và trạng thái người dùng.
 *
 * @param props - Người dùng và quyền chỉnh sửa.
 * @returns Form.
 */
export function UserEditForm({ user, canEdit }: { user: User; canEdit: boolean }) {
  const t = useTranslations("account.users");
  const tCommon = useTranslations("common.actions");
  const { form, onSubmit, isSubmitting } = useUserEditForm(user);
  const { errors } = form.formState;
  const disabled = !canEdit || isSubmitting;

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.root ? <p className="text-destructive text-sm">{errors.root.message}</p> : null}
          <FieldGroup>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="email">{t("fields.email")}</FieldLabel>
              <Input id="email" type="email" disabled={disabled} {...form.register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="last-name">{t("fields.lastName")}</FieldLabel>
                <Input id="last-name" disabled={disabled} {...form.register("lastName")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="first-name">{t("fields.firstName")}</FieldLabel>
                <Input id="first-name" disabled={disabled} {...form.register("firstName")} />
              </Field>
            </div>
            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor="password">{t("fields.newPassword")}</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                disabled={disabled}
                {...form.register("password")}
              />
              <FieldDescription>{t("fields.newPasswordHint")}</FieldDescription>
              <FieldError errors={[errors.password]} />
            </Field>
            {FLAGS.map((flag) => (
              <Controller
                key={flag}
                control={form.control}
                name={flag}
                render={({ field }) => (
                  <SwitchField
                    label={t(`fields.${flag}`)}
                    description={t(`fields.${flag}Hint`)}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                )}
              />
            ))}
          </FieldGroup>
        </CardContent>
        {canEdit ? (
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {tCommon("save")}
            </Button>
          </CardFooter>
        ) : null}
      </form>
    </Card>
  );
}
