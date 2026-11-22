"use client";

import { cn } from "cn";
import { Copy, Eye, type LucideIcon, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

import type { DataTableActionPermissions, DataTableRowAction } from "./data-table.types";

type RowAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  /** Lý do nút bị khoá (thiếu quyền / dòng không cho phép); có = nút mờ, tooltip hiện lý do. */
  disabledReason?: string;
  onClick: () => void;
};

/**
 * Cột Thao tác của một dòng: Xem → Sửa → Sao chép → Xoá, rồi thao tác riêng của bảng (`rowActions`).
 * Thao tác chuẩn có handler thì **luôn hiện**; thiếu quyền (`can`) hoặc dòng không cho phép thì nút mờ,
 * không bấm được, tooltip nói lý do. Nút chỉ icon có tooltip; thao tác phá huỷ đỏ khi rê.
 *
 * @param props - Dòng, callback thao tác chuẩn (không truyền = nghiệp vụ không có thao tác đó), quyền,
 *   cờ khoá theo dòng và thao tác riêng.
 * @returns Cụm nút thao tác.
 */
export function TableRowActions<T>({
  row,
  onView,
  onEdit,
  onCopy,
  onDelete,
  can = {},
  canEdit = true,
  canDelete = true,
  rowActions = [],
}: {
  row: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onCopy?: (row: T) => void;
  onDelete?: (row: T) => void;
  can?: DataTableActionPermissions;
  canEdit?: boolean;
  canDelete?: boolean;
  rowActions?: DataTableRowAction<T>[];
}) {
  const t = useTranslations("common.table");
  const reason = (allowed: boolean | undefined, rowAllowed = true) => {
    if (allowed === false) return t("noPermission");
    return rowAllowed ? undefined : t("rowLocked");
  };
  const actions: RowAction[] = [];
  if (onView)
    actions.push({ key: "view", label: t("view"), icon: Eye, onClick: () => onView(row) });
  if (onEdit)
    actions.push({
      key: "edit",
      label: t("edit"),
      icon: Pencil,
      disabledReason: reason(can.update, canEdit),
      onClick: () => onEdit(row),
    });
  if (onCopy)
    actions.push({
      key: "copy",
      label: t("copy"),
      icon: Copy,
      disabledReason: reason(can.create),
      onClick: () => onCopy(row),
    });
  if (onDelete)
    actions.push({
      key: "delete",
      label: t("delete"),
      icon: Trash2,
      destructive: true,
      disabledReason: reason(can.delete, canDelete),
      onClick: () => onDelete(row),
    });
  for (const action of rowActions) {
    if (action.hidden?.(row)) continue;
    actions.push({
      key: action.key,
      label: action.label,
      icon: action.icon,
      destructive: action.destructive,
      onClick: () => void action.onClick(row),
    });
  }
  if (!actions.length) return null;

  return (
    <div
      className="flex items-center justify-end gap-0.5"
      onDoubleClick={(event) => event.stopPropagation()}
    >
      {actions.map((action) => (
        <Tooltip key={action.key}>
          <TooltipTrigger asChild>
            {/* Nút disabled không nhận rê chuột: bọc span để tooltip lý do vẫn hiện. */}
            <span className="inline-flex" tabIndex={action.disabledReason ? 0 : undefined}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={action.label}
                data-action={action.key}
                disabled={Boolean(action.disabledReason)}
                onClick={action.onClick}
                className={cn(
                  "text-muted-foreground hover:text-foreground size-9 rounded-lg disabled:opacity-40",
                  action.destructive && "hover:bg-destructive/10 hover:text-destructive",
                )}
              >
                <action.icon />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{action.disabledReason ?? action.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
