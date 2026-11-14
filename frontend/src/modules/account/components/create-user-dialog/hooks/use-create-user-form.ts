"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "@/i18n/navigation";
import { APP_ROUTES } from "@/shares/constants/routes";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { useCreateUser } from "../../../hooks/use-account-mutations";
import { type CreateUserFormValues, createUserSchema } from "../../../schemas/user.schema";

const DEFAULT_VALUES: CreateUserFormValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  isActive: true,
  isStaff: false,
  isNovel: false,
};

/**
 * State dialog tạo người dùng; lỗi theo field từ backend được gắn vào đúng ô.
 *
 * @returns Form, trạng thái mở dialog và submit.
 */
export function useCreateUserForm() {
  const t = useTranslations("account.validation");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mutation = useCreateUser();
  const errorMessage = useApiErrorMessage();
  const schema = useMemo(() => createUserSchema(t), [t]);
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = await mutation.mutateAsync(values);
      setOpen(false);
      form.reset(DEFAULT_VALUES);
      router.push(APP_ROUTES.adminUserDetail(user.id));
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      if (fields.email) form.setError("email", { message: errorMessage(error) });
      else if (fields.password) form.setError("password", { message: fields.password });
      else form.setError("root", { message: errorMessage(error) });
    }
  });

  return { form, open, setOpen, onSubmit, isSubmitting: mutation.isPending };
}
