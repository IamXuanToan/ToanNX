"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import type { ChoiceGroup } from "@/shares/components/common/choice-groups/choice-groups";
import type { ChoiceItem } from "@/shares/components/common/choice-list/types";

import { groupPermissionsByModule } from "../services/permission.service";
import type { Permission, RoleSummary } from "../types/iam.types";

/**
 * Đổi danh sách quyền sang nhóm của `ChoiceGroups` (mỗi module một nhóm, tên module đã dịch, mỗi quyền
 * một mục: tên, mã, hành động, mô tả). Mọi màn hiện quyền dùng hook này để giống nhau.
 *
 * @param permissions - Quyền.
 * @returns Nhóm quyền theo module.
 */
export function usePermissionChoiceGroups(permissions: Permission[]): ChoiceGroup[] {
  const t = useTranslations("iam.permissions");
  return useMemo(
    () =>
      groupPermissionsByModule(permissions).map(([module, items]) => ({
        key: module,
        code: module,
        label: t.has(`modules.${module}` as "modules.iam")
          ? t(`modules.${module}` as "modules.iam")
          : module,
        items: items.map((permission) => ({
          value: permission.id,
          label: permission.name,
          code: permission.code,
          badge: permission.action,
          description: permission.description || undefined,
        })),
      })),
    [permissions, t],
  );
}

/**
 * Đổi vai trò sang mục của `ChoiceList` (tên, mã, badge Hệ thống / Đang tắt). Vai trò đang tắt không chọn
 * được (vẫn hiện nếu đã gán, để bỏ chọn).
 *
 * @param roles - Vai trò.
 * @param selected - Id đang chọn (vai trò tắt nhưng đã gán thì vẫn bỏ chọn được).
 * @returns Mục chọn vai trò.
 */
export function useRoleChoiceItems(
  roles: (RoleSummary & { description?: string })[],
  selected: readonly string[],
): ChoiceItem[] {
  const t = useTranslations("iam.roles");
  return useMemo(
    () =>
      roles
        .filter((role) => role.isActive || selected.includes(role.id))
        .map((role) => ({
          value: role.id,
          label: role.name,
          code: role.code,
          description: role.description || undefined,
          badge: !role.isActive ? t("inactive") : role.isSystem ? t("system") : undefined,
          disabled: !role.isActive && !selected.includes(role.id),
        })),
    [roles, selected, t],
  );
}
