"use client";

import { useTableState } from "@/shares/hooks/use-table-state";
import { normalizeSearchText } from "@/shares/lib/search-text";

import { usePermissions } from "../../hooks/use-iam-queries";

/**
 * Danh mục quyền đầy đủ, nhóm theo module; lọc bằng từ khoá (đã nhấn Enter) và nhiều module.
 *
 * @returns Truy vấn, state lọc, danh sách module và quyền đã lọc.
 */
export function usePermissionCatalog() {
  const query = usePermissions();
  const table = useTableState({ filterKeys: ["module"] });
  const permissions = query.data ?? [];
  const keyword = normalizeSearchText(table.keyword);
  const selectedModules = table.getFilterValues("module");
  const filtered = permissions.filter((permission) => {
    const matchesModule = !selectedModules.length || selectedModules.includes(permission.module);
    const text = `${permission.name} ${permission.code} ${permission.description}`;
    return matchesModule && normalizeSearchText(text).includes(keyword);
  });

  return {
    query,
    table,
    modules: [...new Set(permissions.map((permission) => permission.module))].sort(),
    permissions: filtered,
    hasFilters: table.hasFilters || Boolean(table.keyword),
  };
}
