"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";
import { isApiError } from "@/shares/lib/api/api-error";

import {
  useCreateRole,
  useSyncRolePermissions,
  useUpdateRole,
} from "../../../hooks/use-iam-mutations";
import { usePermissions } from "../../../hooks/use-iam-queries";
import { usePermissionChoiceGroups } from "../../../hooks/use-permission-choice-groups";
import { type RoleFormValues, roleSchema } from "../../../schemas/role.schema";
import type { RoleDetail } from "../../../types/iam.types";

const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * State form vai trò dùng chung cho **tạo và sửa**: thông tin, trạng thái và quyền đã chọn. Lưu bản
 * ghi chính trước, rồi đồng bộ quyền (gán phần mới, gỡ phần bỏ). Nút Lưu bật khi thông tin hoặc quyền
 * có thay đổi.
 *
 * @param params - Vai trò đang sửa, giá trị/quyền điền sẵn khi tạo (sao chép), quyền xem/gán và
 *   callback sau khi lưu.
 * @returns Form, nhóm quyền, lựa chọn, trạng thái và submit.
 */
export function useRoleForm({
  role,
  defaults,
  defaultPermissionIds,
  canUpdateInfo = true,
  canReadPermissions,
  canAssignPermissions,
  onSaved,
}: {
  role?: RoleDetail;
  defaults?: Partial<RoleFormValues>;
  defaultPermissionIds?: string[];
  canUpdateInfo?: boolean;
  canReadPermissions: boolean;
  canAssignPermissions: boolean;
  onSaved?: (role: RoleDetail) => unknown;
}) {
  const t = useTranslations("system.iam.validation");
  const errorMessage = useApiErrorMessage();
  const create = useCreateRole();
  const update = useUpdateRole(role?.id ?? "");
  const syncPermissions = useSyncRolePermissions();
  const permissions = usePermissions({ enabled: canReadPermissions });
  const schema = useMemo(() => roleSchema(t), [t]);
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    values: {
      code: role?.code ?? defaults?.code ?? "",
      name: role?.name ?? defaults?.name ?? "",
      description: role?.description ?? defaults?.description ?? "",
      isActive: role?.isActive ?? defaults?.isActive ?? true,
    },
  });

  // Quyền đang có (sửa) hoặc điền sẵn (sao chép); `picked` = lựa chọn người dùng đã đổi.
  const baseIds = useMemo(
    () => role?.permissions.map((permission) => permission.id) ?? defaultPermissionIds ?? [],
    [role, defaultPermissionIds],
  );
  const [picked, setPicked] = useState<string[] | null>(null);
  const selected = picked ?? baseIds;
  const permissionsDirty = role ? !sameIds(selected, baseIds) : false;
  // Không xem được danh mục quyền thì chỉ hiện quyền vai trò đang có.
  const groups = usePermissionChoiceGroups(
    canReadPermissions ? (permissions.data ?? []) : (role?.permissions ?? []),
  );

  const onSubmit = form.handleSubmit(async ({ code, ...values }) => {
    let saved: RoleDetail;
    try {
      if (!role) {
        saved = await create.mutateAsync({ code, ...values });
      } else if (canUpdateInfo && form.formState.isDirty) {
        saved = await update.mutateAsync(values);
      } else {
        saved = role;
      }
    } catch (error) {
      const fields = isApiError(error) ? error.fieldErrors() : {};
      let hasFieldError = false;
      for (const name of ["code", "name", "description", "isActive"] as const) {
        if (fields[name]) {
          form.setError(name, { message: fields[name] });
          hasFieldError = true;
        }
      }
      if (!hasFieldError) form.setError("root", { message: errorMessage(error) });
      return;
    }
    if (canAssignPermissions && !sameIds(selected, role ? baseIds : [])) {
      // Lỗi gán quyền đã được toast; vai trò đã lưu nên vẫn đi tiếp (không tạo trùng khi gửi lại).
      await syncPermissions
        .mutateAsync({ id: saved.id, from: role ? baseIds : [], to: selected })
        .catch(() => undefined);
    }
    setPicked(null);
    await onSaved?.(saved);
  });

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
    isDirty: form.formState.isDirty || permissionsDirty,
    permissions: {
      query: permissions,
      isLoading: canReadPermissions && permissions.isPending,
      isError: canReadPermissions && permissions.isError,
      groups,
      selected,
      setSelected: setPicked,
    },
  };
}
