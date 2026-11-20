"use client";

import { useTranslations } from "next-intl";

import { FilterSelect } from "@/shares/components/common/filter-select";
import { Button } from "@/shares/components/ui/button";

import { useUserRoleFilter } from "./hooks/use-user-role-filter";

/** @returns Bộ lọc vai trò cho danh sách người dùng; dữ liệu do IAM sở hữu. */
export function UserRoleFilter() {
  const t = useTranslations("iam.userRoles");
  const tErrors = useTranslations("errors.generic");
  const { query, value, onValueChange } = useUserRoleFilter();

  if (query.isError) {
    return (
      <Button variant="outline" onClick={() => query.refetch()}>
        {tErrors("retry")}
      </Button>
    );
  }

  return (
    <FilterSelect
      label={t("title")}
      value={value}
      onValueChange={onValueChange}
      options={(query.data ?? []).map((role) => ({
        value: role.id,
        label: role.name,
        description: role.code,
      }))}
      disabled={query.isPending}
      searchable
    />
  );
}
