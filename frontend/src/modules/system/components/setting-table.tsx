"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Edit2 } from "lucide-react";

import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

import type { SystemSetting } from "../types/setting.types";
import { useSettingTable } from "./hooks/use-setting-table";
import { SettingEditDialog } from "./setting-edit-dialog";

interface SettingTableProps {
  canUpdate: boolean;
}

/**
 * Bảng hiển thị danh sách cấu hình hệ thống:
 * Tìm kiếm theo từ khóa, lọc phân loại, hiển thị key-value và thao tác chỉnh sửa.
 *
 * @param props - Quyền cập nhật cấu hình.
 * @returns Bảng cấu hình hệ thống.
 */
export function SettingTable({ canUpdate }: SettingTableProps) {
  const t = useTranslations("system.settings.table");
  const format = useFormatter();
  const { query, table, selectedSetting, isEditDialogOpen, openEditDialog, closeEditDialog } =
    useSettingTable();

  const columns: DataTableColumn<SystemSetting>[] = [
    {
      id: "key",
      header: t("columns.key"),
      sortKey: "key",
      mobile: "title",
      className: "md:w-1/3",
      cell: (setting) => (
        <div className="space-y-1">
          <span className="text-foreground font-mono text-xs font-semibold">{setting.key}</span>
          {setting.description ? (
            <p className="text-muted-foreground line-clamp-2 text-xs">{setting.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "value",
      header: t("columns.value"),
      className: "max-w-xs",
      cell: (setting) => {
        const val = setting.value;
        if (typeof val === "boolean") {
          return (
            <Badge
              variant="outline"
              className={
                val
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold"
              }
            >
              {val ? t("enabled") : t("disabled")}
            </Badge>
          );
        }
        return (
          <code className="bg-muted text-muted-foreground block max-w-xs truncate rounded px-1.5 py-0.5 font-mono text-[11px]">
            {JSON.stringify(val)}
          </code>
        );
      },
    },
    {
      id: "category",
      header: t("columns.category"),
      sortKey: "category",
      mobile: "hidden",
      cell: (setting) => (
        <Badge variant="outline" className="text-xs uppercase">
          {setting.category}
        </Badge>
      ),
    },
    {
      id: "isPublic",
      header: t("columns.isPublic"),
      cell: (setting) => (
        <Badge
          variant="outline"
          className={
            setting.isPublic
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-border/60 text-muted-foreground"
          }
        >
          {setting.isPublic ? t("publicBadge") : t("privateBadge")}
        </Badge>
      ),
    },
    {
      id: "updatedAt",
      header: t("columns.updatedAt"),
      sortKey: "updated_at",
      mobile: "hidden",
      cell: (setting) => (
        <span className="text-muted-foreground text-xs">
          {format.dateTime(new Date(setting.updatedAt), {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (setting) =>
        canUpdate ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(setting)}
            title={t("editValue")}
          >
            <Edit2 className="size-3.5" />
            <span className="sr-only">{t("editValue")}</span>
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        tableId="system-settings-table"
        columns={columns}
        rows={query.data?.items}
        getRowId={(setting) => setting.id}
        getRowLabel={(setting) => setting.key}
        search={{ ...table.search, placeholder: t("searchPlaceholder") }}
        ordering={table.ordering}
        onOrderingChange={table.onOrderingChange}
        isLoading={query.isPending}
        isFetching={query.isFetching && !query.isPending}
        error={query.isError ? { onRetry: () => query.refetch() } : null}
        empty={{ title: t("empty") }}
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
      />

      <SettingEditDialog
        setting={selectedSetting}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      />
    </>
  );
}
