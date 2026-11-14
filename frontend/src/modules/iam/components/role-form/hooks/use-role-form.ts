"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useCreateRole, useUpdateRole } from "../../../hooks/use-iam-mutations";
import { type RoleFormValues, roleSchema } from "../../../schemas/role.schema";
import type { RoleDetail } from "../../../types/iam.types";

/**
 * State form vai trò (tạo mới khi không có `role`, cập nhật khi có).
 *
 * @param role - Vai trò đang sửa (tùy chọn).
 * @param onDone - Gọi khi lưu thành công.
 * @returns Form và submit.
 */
export function useRoleForm(role: RoleDetail | undefined, onDone?: (role: RoleDetail) => void) {
  const t = useTranslations("iam.validation");
  const errorMessage = useApiErrorMessage();
  const create = useCreateRole();
  const update = useUpdateRole(role?.id ?? "");
  const schema = useMemo(() => roleSchema(t), [t]);
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    values: {
      code: role?.code ?? "",
      name: role?.name ?? "",
      description: role?.description ?? "",
      isActive: role?.isActive ?? true,
    },
  });

  const onSubmit = form.handleSubmit(async ({ code, ...values }) => {
    try {
      const saved = role
        ? await update.mutateAsync(values)
        : await create.mutateAsync({ code, ...values });
      onDone?.(saved);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    }
  });

  return { form, onSubmit, isSubmitting: create.isPending || update.isPending };
}
