"use client";

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { PasswordInput } from "@/shares/components/common/password-input";
import { SwitchField } from "@/shares/components/common/switch-field";
import { Button } from "@/shares/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shares/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shares/components/ui/field";
import { Input } from "@/shares/components/ui/input";

import { useCreateUserForm } from "./hooks/use-create-user-form";

/**
 * Dialog tạo người dùng (không có đăng ký công khai; chỉ admin tạo).
 *
 * @returns Nút + dialog tạo người dùng.
 */
export function CreateUserDialog() {
  const t = useTranslations("account.users");
  const tCommon = useTranslations("common.actions");
  const { form, open, setOpen, onSubmit, isSubmitting } = useCreateUserForm();
  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {t("create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("create")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>
          {errors.root ? <p className="text-destructive text-sm">{errors.root.message}</p> : null}
          <FieldGroup>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="new-email">{t("fields.email")}</FieldLabel>
              <Input id="new-email" type="email" {...form.register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor="new-password">{t("fields.password")}</FieldLabel>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="new-last-name">{t("fields.lastName")}</FieldLabel>
                <Input id="new-last-name" {...form.register("lastName")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-first-name">{t("fields.firstName")}</FieldLabel>
                <Input id="new-first-name" {...form.register("firstName")} />
              </Field>
            </div>
            <Controller
              control={form.control}
              name="isStaff"
              render={({ field }) => (
                <SwitchField
                  label={t("fields.isStaff")}
                  description={t("fields.isStaffHint")}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
