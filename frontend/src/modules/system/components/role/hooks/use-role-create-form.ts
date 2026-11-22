"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { SYSTEM_ROUTES } from "../../../constants/routes";
import { useRole } from "../../../hooks/use-iam-queries";
import type { RoleFormValues } from "../../../schemas/role.schema";
import type { RoleDetail } from "../../../types/iam.types";

/**
 * Điền sẵn khi tạo vai trò: sao chép (`copyFrom`) thì mã `<MÃ>_COPY`, tên "(bản sao)", mô tả, trạng
 * thái và quyền của vai trò nguồn. Lưu xong chuyển tới trang chi tiết.
 *
 * @param copyFrom - Id vai trò nguồn khi sao chép.
 * @returns Giá trị/quyền điền sẵn, trạng thái tải bản nguồn và callback sau lưu.
 */
export function useRoleCreateForm(copyFrom?: string) {
  const t = useTranslations("system.iam.roles");
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const source = useRole(copyFrom ?? "", { enabled: Boolean(copyFrom) });
  const defaults: Partial<RoleFormValues> | undefined = source.data
    ? {
        code: `${source.data.code.slice(0, 59)}_COPY`,
        name: t("copyName", { name: source.data.name }),
        description: source.data.description,
        isActive: source.data.isActive,
      }
    : undefined;

  return {
    defaults,
    defaultPermissionIds: source.data?.permissions.map((permission) => permission.id),
    source,
    errorMessage,
    isLoadingSource: Boolean(copyFrom) && source.isLoading,
    onSaved: (role: RoleDetail) => router.push(SYSTEM_ROUTES.roleDetail(role.id)),
  };
}
