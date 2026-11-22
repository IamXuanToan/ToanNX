"use client";

import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

import { ChoiceGroups } from "@/shares/components/common/choice-groups";
import { EmptyState } from "@/shares/components/common/empty-state";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { SearchInput } from "@/shares/components/common/search-input";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { usePermissionChoiceGroups } from "../../hooks/use-permission-choice-groups";
import { usePermissionCatalog } from "./hooks/use-permission-catalog";

/**
 * Danh mục quyền chỉ đọc bằng `ChoiceGroups` (accordion theo module, card nhỏ mỗi quyền);
 * tìm theo từ khoá và lọc nhiều module.
 *
 * @returns Danh mục quyền.
 */
export function PermissionCatalog() {
  const t = useTranslations("system.iam.permissions");
  const { query, table, permissions, modules, hasFilters } = usePermissionCatalog();
  const groups = usePermissionChoiceGroups(permissions);

  if (query.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      <ChoiceGroups
        groups={groups}
        value={[]}
        control="none"
        toolbar={
          <>
            <SearchInput
              {...table.search}
              placeholder={t("searchPlaceholder")}
              className="min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
            />
            <FilterSelect
              label={t("module")}
              value={table.getFilterValues("module")}
              onValueChange={(values) => table.setFilterValues("module", values)}
              options={modules.map((module) => ({
                value: module,
                label: t.has(`modules.${module}` as "modules.system")
                  ? t(`modules.${module}` as "modules.system")
                  : module,
              }))}
            />
          </>
        }
      />
      {groups.length === 0 ? (
        <div className="bg-card rounded-xl border">
          <EmptyState
            icon={hasFilters ? <SearchX /> : undefined}
            title={t("empty")}
            action={
              hasFilters ? (
                <Button variant="outline" onClick={table.clearFilters}>
                  {t("clearFilters")}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : null}
    </div>
  );
}
