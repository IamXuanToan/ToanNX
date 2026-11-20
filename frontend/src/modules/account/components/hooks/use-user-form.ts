"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";
import { useFormExtensionRegistry } from "@/shares/components/common/hooks/use-form-extension";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import { ACCOUNT_ROUTES } from "../../constants/routes";
import { useCreateUser } from "../../hooks/use-create-user";
import { useUpdateUser } from "../../hooks/use-update-user";
import { useUser } from "../../hooks/use-user";
import { type CreateUserFormValues, createUserSchema, toUserInput, updateUserSchema, USER_FORM_FIELDS } from "../../schemas/user.schema";
import type { User } from "../../types/user.types";

const EMPTY: CreateUserFormValues = {
  email: "",
  password: "",
  username: "",
  firstName: "",
  lastName: "",
  avatar: null,
  isActive: true,
  isStaff: false,
  isSuperuser: false,
  isNovel: false,
};

/** Giá trị form từ một người dùng có sẵn (sửa, hoặc nguồn khi sao chép). */
function fromUser(user: User, { copy }: { copy: boolean }): CreateUserFormValues {
  return {
    ...EMPTY,
    // Sao chép: email, tên người dùng phải duy nhất nên để trống.
    email: copy ? "" : user.email,
    username: copy ? "" : (user.username ?? ""),
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar ? { id: user.avatar.id, url: user.avatar.url, name: "" } : null,
    isActive: user.isActive,
    isStaff: user.isStaff,
    isSuperuser: user.isSuperuser,
    isNovel: user.isNovel,
  };
}

/**
 * State form người dùng **dùng chung cho tạo và sửa**: cùng trường, cùng bố cục. Tạo (có thể sao chép
 * từ `copyFrom`) thì mật khẩu bắt buộc, lưu xong sang trang chi tiết; sửa thì mật khẩu trống = giữ nguyên.
 * Sau khi lưu chạy phần mở rộng cắm qua slot (IAM đồng bộ vai trò). Nút Lưu bật khi form hoặc phần mở
 * rộng có thay đổi. Cờ superuser chỉ superuser đổi được và chỉ khi đó mới gửi.
 *
 * @param params - Người dùng đang sửa hoặc id nguồn khi sao chép.
 * @returns Form, submit, sổ phần mở rộng và trạng thái.
 */
export function useUserForm({ user, copyFrom }: { user?: User; copyFrom?: string }) {
  const t = useTranslations("account.validation");
  const tUsers = useTranslations("account.users");
  const router = useRouter();
  const create = useCreateUser();
  const update = useUpdateUser(user?.id ?? "");
  const errorMessage = useApiErrorMessage();
  const { data: current } = useCurrentUser();
  const canSetSuperuser = Boolean(current?.user.isSuperuser);
  const schema = useMemo(() => (user ? updateUserSchema(t) : createUserSchema(t)), [t, user]);
  const source = useUser(copyFrom ?? "", { enabled: !user && Boolean(copyFrom) });
  const values = user
    ? fromUser(user, { copy: false })
    : source.data
      ? {
          ...fromUser(source.data, { copy: true }),
          isSuperuser: source.data.isSuperuser && canSetSuperuser,
        }
      : undefined;
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    values,
    // Sao chép: dữ liệu nguồn về sau thì điền lại, giữ những ô người dùng đã gõ.
    resetOptions: { keepDirtyValues: !user },
  });
  const extensions = useFormExtensionRegistry(form.formState.isSubmitting);

  const onSubmit = form.handleSubmit(async (formValues) => {
    const { isSuperuser, ...input } = toUserInput(formValues);
    const body = canSetSuperuser ? { ...input, isSuperuser } : input;
    let saved: User;
    try {
      saved = user ? await update.mutateAsync(body) : await create.mutateAsync(body);
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      let hasFieldError = false;
      for (const name of USER_FORM_FIELDS) {
        if (fields[name]) {
          form.setError(name, { message: fields[name] });
          hasFieldError = true;
        }
      }
      const avatarError = fields.avatarId ?? fields.avatar;
      if (avatarError) {
        form.setError("avatar", { message: avatarError });
        hasFieldError = true;
      }
      if (!hasFieldError) form.setError("root", { message: errorMessage(error) });
      return;
    }
    try {
      await extensions.run(saved);
    } catch (error) {
      // Người dùng đã lưu: báo lỗi phần mở rộng, không lưu lại lần nữa.
      toast.error(tUsers("extensionFailed", { message: errorMessage(error) }));
    }
    if (user) form.resetField("password");
    else router.push(ACCOUNT_ROUTES.userDetail(saved.id));
  });

  return {
    form,
    onSubmit,
    extensions: extensions.context,
    isDirty: form.formState.isDirty || extensions.isDirty,
    canSetSuperuser,
    isSubmitting: form.formState.isSubmitting,
    source,
    errorMessage,
    isLoadingSource: !user && source.isLoading,
  };
}
