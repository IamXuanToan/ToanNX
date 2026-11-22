"use client";

import { useTableState } from "@/shares/hooks/use-table-state";

import { useRoleOptions } from "../../hooks/use-iam-queries";

/** @returns Vai trò và state URL (chọn nhiều) của bộ lọc người dùng, ghép qua slot của page. */
export function useUserRoleFilter() {
  const query = useRoleOptions();
  const table = useTableState({ filterKeys: ["role"] });
  return {
    query,
    value: table.getFilterValues("role"),
    onValueChange: (values: string[]) => table.setFilterValues("role", values),
  };
}
