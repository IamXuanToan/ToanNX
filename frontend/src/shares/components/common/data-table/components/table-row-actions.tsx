"use client";

import { cn } from "cn";
import { Copy, type LucideIcon, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shares/components/ui/tooltip";

import type { DataTableRowAction } from "../types";

type RowAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  onClick: () => void;
};

/**
 * Cột Thao tác của một dòng: Sửa → Sao chép → Xoá, rồi thao tác riêng của bảng (`rowActions`).
 * Nút chỉ icon có tooltip; thao tác phá huỷ đỏ khi rê.
 *
 * @param props - Dòng, callback thao tác chuẩn (không truyền thì không hiện) và thao tác riêng.
 * @returns Cụm nút thao tác.
 */
export function TableRowActions<T>({
  row,
  onEdit,
  onCopy,
  onDelete,
  rowActions = [],
}: {
  row: T;
  onEdit?: (row: T) => void;
  onCopy?: (row: T) => void;
  onDelete?: (row: T) => void;
  rowActions?: DataTableRowAction<T>[];
}) {
  const t = useTranslations("common.table");
  const actions: RowAction[] = [];
  if (onEdit)
    actions.push({ key: "edit", label: t("edit"), icon: Pencil, onClick: () => onEdit(row) });
  if (onCopy)
    actions.push({ key: "copy", label: t("copy"), icon: Copy, onClick: () => onCopy(row) });
  if (onDelete)
    actions.push({
      key: "delete",
      label: t("delete"),
      icon: Trash2,
      destructive: true,
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={action.label}
              data-action={action.key}
              onClick={action.onClick}
              className={cn(
                "text-muted-foreground hover:text-foreground size-9 rounded-lg",
                action.destructive && "hover:bg-destructive/10 hover:text-destructive",
              )}
            >
              <action.icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{action.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
