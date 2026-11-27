"use client";

import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";
import { formatOwnerDisplayName, formatOwnerDisplayTooltip } from "@/shares/lib/user-display";

import { VAULT_CATEGORIES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { VaultItem } from "../../types/vault-item.types";
import { useVaultItemTable } from "./hooks/use-vault-item-table";
import { VaultRevealDialog } from "./vault-reveal-dialog";

/**
 * Bảng Két sắt bí mật (chỉ hiển thị 4 ký tự cuối, giải mã qua POST `reveal`).
 *
 * @param props - Quyền sửa/xóa/giải mã.
 * @returns Bảng Két sắt.
 */
export function VaultItemTable({
  canUpdate,
  canDelete,
  canReveal,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  canReveal: boolean;
}) {
  const t = useTranslations("workspace.vault");
  const tCommon = useTranslations("workspace.common");
  const state = useVaultItemTable();
  const { table, query } = state;

  const columns: DataTableColumn<VaultItem>[] = [
    {
      id: "title",
      header: t("fields.title"),
      sortKey: "title",
      mobile: "title",
      className: "md:w-full",
      cell: (item) => (
        <div className="min-w-0">
          <Link
            href={WORKSPACE_ROUTES.vaultDetail(item.id)}
            className="hover:text-primary font-medium underline-offset-4 hover:underline"
          >
            {item.title}
          </Link>
          {item.username ? (
            <p className="text-muted-foreground truncate text-xs">{item.username}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: t("fields.category"),
      cell: (item) => <Badge variant="secondary">{t(`categories.${item.category}`)}</Badge>,
    },
    {
      id: "secretLast4",
      header: t("fields.secretLast4"),
      cell: (item) => (
        <span className="font-mono text-xs">
          {item.secretLast4 ? `••••${item.secretLast4}` : "—"}
        </span>
      ),
    },
    {
      id: "lastRevealedAt",
      header: t("fields.lastRevealedAt"),
      hideBelow: "lg",
      cell: (item) => <TimestampText value={item.lastRevealedAt} />,
    },
    ...(state.canManageAll
      ? [
          {
            id: "owner",
            header: tCommon("owner"),
            hideBelow: "xl" as const,
            cell: (item: VaultItem) => {
              const ownerLabel = formatOwnerDisplayName(item);
              return (
                <AppTooltip content={formatOwnerDisplayTooltip(item)}>
                  <span className="text-muted-foreground block max-w-44 truncate">
                    {ownerLabel || "—"}
                  </span>
                </AppTooltip>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        tableId="workspace-vault"
        columns={columns}
        rows={query.data?.items}
        getRowId={(item) => item.id}
        getRowLabel={(item) => item.title}
        search={{ ...table.search, placeholder: t("searchPlaceholder") }}
        onClearFilters={table.hasFilters ? table.clearFilters : undefined}
        filters={
          <>
            <FilterSelect
              label={t("fields.category")}
              value={table.getFilterValues("category")}
              onValueChange={(values) => table.setFilterValues("category", values)}
              options={VAULT_CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
            />
            {state.canFilterOwner ? (
              <FilterSelect
                label={tCommon("owner")}
                value={table.getFilterValues("owner")}
                onValueChange={(values) => table.setFilterValues("owner", values.slice(-1))}
                options={state.ownerOptions}
              />
            ) : null}
          </>
        }
        ordering={table.ordering}
        onOrderingChange={table.onOrderingChange}
        isLoading={query.isPending}
        isFetching={query.isFetching && !query.isPending}
        error={query.isError ? { onRetry: () => query.refetch() } : null}
        empty={{ title: tCommon("noData") }}
        onReload={() => query.refetch()}
        pagination={
          query.data
            ? {
                value: query.data.pagination,
                onPageChange: table.onPageChange,
                onPageSizeChange: table.onPageSizeChange,
              }
            : undefined
        }
        rowActions={
          canReveal
            ? [
                {
                  key: "reveal",
                  label: t("reveal"),
                  icon: Eye,
                  onClick: (item) => void state.startReveal(item),
                },
              ]
            : undefined
        }
        onView={state.view}
        onEdit={state.edit}
        onDelete={state.remove}
        can={{ update: canUpdate, delete: canDelete }}
        onBulkDelete={canDelete ? state.bulkDelete : undefined}
        aria-label={t("title")}
      />

      <VaultRevealDialog
        open={Boolean(state.revealItem)}
        onOpenChange={state.closeReveal}
        title={state.revealItem?.title ?? ""}
        revealed={state.revealDialog.revealed}
        isRevealing={state.revealDialog.isRevealing}
        onCopy={() => void state.revealDialog.copySecret()}
      />
    </>
  );
}
