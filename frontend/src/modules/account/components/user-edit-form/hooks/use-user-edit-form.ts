"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { useUpdateUser } from "../../../hooks/use-account-mutations";
import { updateUserSchema, type UpdateUserFormValues } from "../../../schemas/user.schema";
import type { User } from "../../../types/account.types";

/**
 * State form cập nhật người dùng.
 *
 * @param user - Người dùng đang sửa.
 * @returns Form và hàm submit.
 */
export function useUserEditForm(user: User) {
  const t = useTranslations("account.validation");
  const mutation = useUpdateUser(user.id);
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => updateUserSchema(t), [t]);
  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(schema),
    values: {
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      isStaff: user.isStaff,
      isNovel: user.isNovel,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      form.resetField("password");
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      if (fields.password) form.setError("password", { message: fields.password });
      else form.setError("root", { message: errorMessage(error) });
    }
  });

  return { form, onSubmit, isSubmitting: mutation.isPending };
}
